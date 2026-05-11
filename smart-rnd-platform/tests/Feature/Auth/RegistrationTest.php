<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'role' => 'student',
        ]);
    }

    public function test_faculty_registration_can_create_supervisor_role(): void
    {
        $response = $this->post('/register', [
            'name' => 'Supervisor User',
            'email' => 'supervisor@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'registration_kind' => 'faculty',
            'faculty_role' => 'supervisor',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
        $this->assertDatabaseHas('users', [
            'email' => 'supervisor@example.com',
            'role' => 'supervisor',
        ]);
    }

    public function test_faculty_registration_can_create_hod_role(): void
    {
        $response = $this->post('/register', [
            'name' => 'HoD User',
            'email' => 'hod@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'registration_kind' => 'faculty',
            'faculty_role' => 'hod',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'hod@example.com',
            'role' => 'hod',
        ]);
    }

    public function test_student_registration_ignores_faculty_role_field(): void
    {
        $this->post('/register', [
            'name' => 'Student User',
            'email' => 'student2@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'registration_kind' => 'student',
            'faculty_role' => 'hod',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'student2@example.com',
            'role' => 'student',
        ]);
    }

    public function test_industry_registration_creates_industry_role(): void
    {
        $this->post('/register', [
            'name' => 'Industry Org',
            'email' => 'industry@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
            'registration_kind' => 'industry',
        ]);

        $this->assertAuthenticated();
        $this->assertDatabaseHas('users', [
            'email' => 'industry@example.com',
            'role' => 'industry',
        ]);
    }
}
