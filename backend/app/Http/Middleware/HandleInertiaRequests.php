<?php

namespace App\Http\Middleware;

use App\Models\GroupChatNotification;
use App\Models\ChallengeRequest;
use App\Models\IndustryChallenge;
use App\Models\User;
use App\Services\ChallengeWorkflowService;
use App\Services\NotificationFeedService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Support\CachedSchema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    private const NAV_BELL_CACHE_KEY = '_sr_nav_bell';

    /** Cached across HTTP requests to cut round-trips to remote DB (e.g. Supabase). Use 0 to disable. */
    private const NAV_BELL_CROSS_REQUEST_TTL_SECONDS = 25;

    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            'passwordlessLoginEnabled' => fn () => (bool) config('auth.passwordless_login'),
            'impersonation' => static function () use ($request) {
                if (! $request->session()->has('impersonator_id')) {
                    return null;
                }

                $impersonator = User::query()->find($request->session()->get('impersonator_id'));

                return [
                    'active' => true,
                    'adminName' => $impersonator?->name,
                ];
            },
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'originality' => fn () => $request->session()->get('originality'),
            ],
            'supervisorMeta' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user || ! in_array($user->role, ['supervisor', 'admin'], true)) {
                    return null;
                }

                // Keep current counts lightweight and consistent with existing UI.
                // (Student-idea review queue counts; supervisor scoping is applied in service-layer pages.)
                $pending = 0;
                $awaitingRevision = 0;

                $canScopeByStudentIdea = CachedSchema::hasTable('industry_challenges')
                    && CachedSchema::hasColumn('industry_challenges', 'kind')
                    && CachedSchema::hasColumn('industry_challenges', 'review_status');

                if ($canScopeByStudentIdea) {
                    $counts = IndustryChallenge::query()
                        ->where('is_active', 'true')
                        ->where('kind', 'student_idea')
                        ->whereIn('review_status', ['pending_action', 'awaiting_revision'])
                        ->groupBy('review_status')
                        ->selectRaw('review_status, COUNT(*) as aggregate')
                        ->pluck('aggregate', 'review_status');
                    $pending = (int) ($counts['pending_action'] ?? 0);
                    $awaitingRevision = (int) ($counts['awaiting_revision'] ?? 0);
                }

                $pendingChallengeRequestsQuery = ChallengeRequest::query()->where('status', 'pending');
                if ($user->role === 'supervisor') {
                    $pendingChallengeRequestsQuery->where('supervisor_id', $user->id);
                }
                $pendingChallengeRequests = $pendingChallengeRequestsQuery->count();

                return [
                    'pending_count' => $pending,
                    'awaiting_revision_count' => $awaitingRevision,
                    'review_queue_count' => $pending + $awaitingRevision,
                    'notification_count' => $awaitingRevision,
                    'pending_challenge_requests_count' => $pendingChallengeRequests,
                ];
            })(),
            'hodMeta' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user || ! in_array($user->role, ['hod', 'admin'], true)) {
                    return null;
                }

                /** @var ChallengeWorkflowService $svc */
                $svc = app(ChallengeWorkflowService::class);

                return [
                    'pending_industry_nominations_count' => $svc->hodIndustryAwaitingNominationCount($user),
                ];
            })(),
            'groupChatUnreadCount' => fn () => $this->memoNavBell($request)['groupChatUnreadCount'],
            'facultyModules' => fn () => (function () use ($request) {
                $user = $request->user();
                if (! $user) {
                    return [
                        'canExportReports' => false,
                        'canSupervisorGantt' => false,
                    ];
                }

                return [
                    'canExportReports' => in_array($user->role, ['supervisor', 'hod', 'admin'], true),
                    'canSupervisorGantt' => in_array($user->role, ['supervisor', 'admin'], true),
                ];
            })(),
            'inboxUnreadTotal' => fn () => $this->memoNavBell($request)['inboxUnreadTotal'],
        ];
    }

    /**
     * @return array{groupChatUnreadCount: int, inboxUnreadTotal: int}
     */
    private function memoNavBell(Request $request): array
    {
        if ($request->attributes->has(self::NAV_BELL_CACHE_KEY)) {
            return $request->attributes->get(self::NAV_BELL_CACHE_KEY);
        }

        $user = $request->user();
        if (! $user) {
            $data = ['groupChatUnreadCount' => 0, 'inboxUnreadTotal' => 0];
            $request->attributes->set(self::NAV_BELL_CACHE_KEY, $data);

            return $data;
        }

        if (self::NAV_BELL_CROSS_REQUEST_TTL_SECONDS > 0) {
            $ttl = app()->environment('local')
                ? max(self::NAV_BELL_CROSS_REQUEST_TTL_SECONDS, 90)
                : self::NAV_BELL_CROSS_REQUEST_TTL_SECONDS;

            $data = Cache::remember(
                self::navBellRemoteCacheKey($user),
                $ttl,
                fn () => $this->computeNavBellForUser($user)
            );
        } else {
            $data = $this->computeNavBellForUser($user);
        }

        $request->attributes->set(self::NAV_BELL_CACHE_KEY, $data);

        return $data;
    }

    public static function forgetNavBellRemoteCache(User $user): void
    {
        Cache::forget(self::navBellRemoteCacheKey($user));
    }

    private static function navBellRemoteCacheKey(User $user): string
    {
        return 'sr_nav_bell_u'.(int) $user->id.'_r'.sha1((string) ($user->role ?? ''));
    }

    /**
     * @return array{groupChatUnreadCount: int, inboxUnreadTotal: int}
     */
    private function computeNavBellForUser(User $user): array
    {
        $gc = 0;
        if (CachedSchema::hasTable('group_chat_notifications') && in_array(($user->role ?? null), ['student', 'supervisor', 'admin', 'hod'], true)) {
            $gc = (int) GroupChatNotification::where('user_id', $user->id)->where('is_read', 'false')->count();
        }

        $feed = 0;
        if (CachedSchema::hasTable('user_notification_reads')) {
            $feed = (int) app(NotificationFeedService::class)->feedUnreadEstimate($user);
        }

        return [
            'groupChatUnreadCount' => $gc,
            'inboxUnreadTotal' => min(99, $gc + $feed),
        ];
    }
}
