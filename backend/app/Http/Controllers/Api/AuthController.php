<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    private function abilitiesForRole(string $role): array
    {
        return match ($role) {
            'student' => ['projects:read', 'proposals:create', 'submissions:create'],
            'supervisor' => ['projects:read', 'milestones:manage', 'evaluations:manage', 'proposals:review', 'reports:read', 'reports:export', 'gantt:read'],
            'hod' => ['projects:read', 'groups:manage', 'reports:read', 'reports:export'],
            'industry' => ['projects:read', 'proposals:review'],
            'admin' => ['*'],
            default => ['projects:read'],
        };
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        // API registration is student-only; elevated roles are provisioned by administrators.
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'student',
        ]);

        $abilities = $this->abilitiesForRole($user->role);
        $token = $user->createToken('auth_token', $abilities)->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'تم إنشاء الحساب بنجاح',
            'token' => $token,
            'user' => $user,
            'permissions' => $abilities,
        ], 201);
    }

    public function login(Request $request)
    {
        // 1. التحقق من المدخلات
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // 2. البحث عن المستخدم بالبريد الإلكتروني
        $user = User::where('email', $request->email)->first();

        // 3. التحقق من كلمة المرور (ملاحظة: Laravel يتوقعها مشفرة بـ Hash)
        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'بيانات الدخول غير صحيحة'
            ], 401);
        }

        // 4. إنشاء Token للمستخدم (باستخدام Sanctum)
        $abilities = $this->abilitiesForRole($user->role);
        $token = $user->createToken('auth_token', $abilities)->plainTextToken;

        return response()->json([
            'status' => 'success',
            'token' => $token,
            'user' => $user,
            'permissions' => $abilities,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم تسجيل الخروج بنجاح',
        ]);
    }
}