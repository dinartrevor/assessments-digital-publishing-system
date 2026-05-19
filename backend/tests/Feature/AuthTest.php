<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test successful registration.
     */
    public function test_register_success(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'created_at',
                    ]
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'message' => 'User successfully registered',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'name' => 'John Doe',
        ]);
    }

    /**
     * Test registration validation errors.
     */
    public function test_register_validation_error(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => '', // too short
            'email' => 'not-an-email', // invalid email
            'password' => '123', // too short
            'password_confirmation' => '123456', // non-matching
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'status',
                'message',
                'errors' => [
                    'name',
                    'email',
                    'password',
                ]
            ])
            ->assertJson([
                'status' => 'error',
                'message' => 'Validation error',
            ]);
    }

    /**
     * Test successful login.
     */
    public function test_login_success(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'created_at',
                    ]
                ]
            ])
            ->assertJson([
                'status' => 'success',
            ]);
    }

    /**
     * Test login with invalid credentials.
     */
    public function test_login_invalid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(401)
            ->assertJsonStructure([
                'status',
                'message',
            ])
            ->assertJson([
                'status' => 'error',
                'message' => 'Unauthorized: Invalid email or password',
            ]);
    }

    /**
     * Test successful logout.
     */
    public function test_logout_authenticated_user(): void
    {
        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Successfully logged out',
            ]);

        // Attempting to access protected profile after logout should be unauthorized
        $profileResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/me');

        $profileResponse->assertStatus(401);
    }

    /**
     * Test unauthorized access without token.
     */
    public function test_unauthorized_access_without_token(): void
    {
        $response = $this->getJson('/api/me');

        $response->assertStatus(401);
    }

    /**
     * Test token refresh.
     */
    public function test_refresh_token_success(): void
    {
        $user = User::factory()->create();
        $token = JWTAuth::fromUser($user);

        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/refresh');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'access_token',
                    'token_type',
                    'expires_in',
                    'user' => [
                        'id',
                        'name',
                        'email',
                        'created_at',
                    ]
                ]
            ])
            ->assertJson([
                'status' => 'success',
            ]);
    }
}
