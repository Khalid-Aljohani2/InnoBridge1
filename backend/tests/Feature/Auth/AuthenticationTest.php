<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        if (config('auth.passwordless_login')) {
            $this->markTestSkipped('Password verification is skipped when AUTH_PASSWORDLESS_LOGIN is enabled.');
        }

        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_passwordless_web_login_accept_email_only_when_enabled(): void
    {
        if (! config('auth.passwordless_login')) {
            $this->markTestSkipped('Enable AUTH_PASSWORDLESS_LOGIN with APP_ENV testing to run this test.');
        }

        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'selected_role' => $user->role,
        ]);

        $this->assertAuthenticatedAs($user);
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
