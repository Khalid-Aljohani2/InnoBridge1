<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPanelTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): User
    {
        return User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
    }

    public function test_admin_dashboard_redirects_to_admin_overview(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->get(route('dashboard'))->assertRedirect(route('admin.overview'));
    }

    public function test_admin_can_view_overview_and_users(): void
    {
        $admin = $this->makeAdmin();

        $this->actingAs($admin)->get(route('admin.overview'))->assertOk();

        User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);

        $this->actingAs($admin)->get(route('admin.users.index'))->assertOk();
    }

    public function test_non_admin_cannot_open_admin_panel(): void
    {
        $student = User::factory()->create(['role' => 'student', 'email_verified_at' => now()]);

        $this->actingAs($student)->get(route('admin.overview'))->assertRedirect(route('dashboard'));
    }

    public function test_admin_can_impersonate_and_leave(): void
    {
        $admin = $this->makeAdmin();
        $student = User::factory()->create([
            'role' => 'student',
            'email_verified_at' => now(),
        ]);

        $this->actingAs($admin)
            ->post(route('admin.impersonate.start', $student))
            ->assertRedirect(route('dashboard'));

        $this->assertAuthenticatedAs($student);

        $this->post(route('admin.impersonate.leave'))
            ->assertRedirect(route('admin.users.index'));

        $this->assertAuthenticatedAs($admin);
    }

    public function test_admin_cannot_impersonate_another_admin(): void
    {
        $admin = $this->makeAdmin();
        $other = User::factory()->create(['role' => 'admin', 'email_verified_at' => now()]);

        $this->actingAs($admin)
            ->from(route('admin.users.index'))
            ->post(route('admin.impersonate.start', $other))
            ->assertRedirect(route('admin.users.index'))
            ->assertSessionHas('error');

        $this->assertAuthenticatedAs($admin);
    }
}
