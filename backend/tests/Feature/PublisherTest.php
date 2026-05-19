<?php

namespace Tests\Feature;

use App\Models\Publisher;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PublisherTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    /**
     * Test creating a publisher successfully.
     */
    public function test_create_publisher_success(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/publishers', [
            'name' => 'O\'Reilly Media',
            'address' => '1005 Gravenstein Highway North, Sebastopol, CA 95472',
            'phone' => '+1-707-827-7000',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'address',
                    'phone',
                    'books_count',
                    'created_at',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'message' => 'Publisher successfully created',
                'data' => [
                    'name' => 'O\'Reilly Media',
                    'address' => '1005 Gravenstein Highway North, Sebastopol, CA 95472',
                    'phone' => '+1-707-827-7000',
                    'books_count' => 0,
                ]
            ]);

        $this->assertDatabaseHas('publishers', [
            'name' => 'O\'Reilly Media',
            'phone' => '+1-707-827-7000',
        ]);
    }

    /**
     * Test validation error when creating a publisher.
     */
    public function test_create_publisher_validation_error(): void
    {
        // Missing required 'name' field
        $response = $this->actingAs($this->user, 'api')->postJson('/api/publishers', [
            'address' => 'Some address',
            'phone' => '123456789',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name']);
    }

    /**
     * Test getting a single publisher.
     */
    public function test_get_single_publisher_success(): void
    {
        $publisher = Publisher::factory()->create([
            'name' => 'Packt Publishing',
            'address' => 'Birmingham, UK',
        ]);

        $response = $this->actingAs($this->user, 'api')->getJson("/api/publishers/{$publisher->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'id',
                    'name',
                    'address',
                    'phone',
                    'books_count',
                    'created_at',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $publisher->id,
                    'name' => 'Packt Publishing',
                    'address' => 'Birmingham, UK',
                ]
            ]);
    }

    /**
     * Test getting a single publisher returns 404 if not found.
     */
    public function test_get_single_publisher_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->getJson('/api/publishers/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Publisher not found',
            ]);
    }

    /**
     * Test updating a publisher successfully.
     */
    public function test_update_publisher_success(): void
    {
        $publisher = Publisher::factory()->create([
            'name' => 'Packt Publishing',
            'address' => 'Birmingham, UK',
        ]);

        $response = $this->actingAs($this->user, 'api')->putJson("/api/publishers/{$publisher->id}", [
            'name' => 'Packt Publishing (Updated)',
            'address' => 'London, UK',
            'phone' => '+44 20 7946 0958',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Publisher successfully updated',
                'data' => [
                    'id' => $publisher->id,
                    'name' => 'Packt Publishing (Updated)',
                    'address' => 'London, UK',
                    'phone' => '+44 20 7946 0958',
                ]
            ]);

        $this->assertDatabaseHas('publishers', [
            'id' => $publisher->id,
            'name' => 'Packt Publishing (Updated)',
        ]);
    }

    /**
     * Test updating a non-existing publisher returns 404.
     */
    public function test_update_publisher_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->putJson('/api/publishers/999', [
            'name' => 'New Name',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Publisher not found',
            ]);
    }

    /**
     * Test deleting a publisher successfully.
     */
    public function test_delete_publisher_success(): void
    {
        $publisher = Publisher::factory()->create();

        $response = $this->actingAs($this->user, 'api')->deleteJson("/api/publishers/{$publisher->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Publisher successfully deleted',
            ]);

        $this->assertDatabaseMissing('publishers', [
            'id' => $publisher->id,
        ]);
    }

    /**
     * Test deleting a non-existing publisher returns 404.
     */
    public function test_delete_publisher_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->deleteJson('/api/publishers/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Publisher not found',
            ]);
    }

    /**
     * Test getting the publisher list (pagination, search, filtering, and sorting).
     */
    public function test_get_publisher_list_and_response_features(): void
    {
        // Seed 12 publishers
        Publisher::factory()->count(12)->create();

        // 1. Check basic pagination and structure
        $response = $this->actingAs($this->user, 'api')->getJson('/api/publishers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'address',
                        'phone',
                        'books_count',
                        'created_at',
                    ]
                ],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'last_page', 'per_page', 'total']
            ]);

        $this->assertCount(10, $response->json('data')); // default pagination is 10
        $this->assertEquals(12, $response->json('meta.total'));

        // 2. Check custom pagination
        $responseCustom = $this->actingAs($this->user, 'api')->getJson('/api/publishers?per_page=4');
        $responseCustom->assertStatus(200);
        $this->assertCount(4, $responseCustom->json('data'));

        // 3. Check search functionality
        Publisher::factory()->create([
            'name' => 'UniquePublisherXYZ',
            'address' => 'Some unique address term',
        ]);

        $responseSearch = $this->actingAs($this->user, 'api')->getJson('/api/publishers?search=UniquePublisherXYZ');
        $responseSearch->assertStatus(200);
        $this->assertCount(1, $responseSearch->json('data'));
        $this->assertEquals('UniquePublisherXYZ', $responseSearch->json('data.0.name'));

        // 4. Check sorting functionality
        Publisher::query()->delete();
        Publisher::factory()->create(['name' => 'Publisher B']);
        Publisher::factory()->create(['name' => 'Publisher A']);
        Publisher::factory()->create(['name' => 'Publisher C']);

        $responseSort = $this->actingAs($this->user, 'api')->getJson('/api/publishers?sort_by=name&sort_order=asc');
        $responseSort->assertStatus(200);
        $this->assertEquals('Publisher A', $responseSort->json('data.0.name'));
        $this->assertEquals('Publisher B', $responseSort->json('data.1.name'));
        $this->assertEquals('Publisher C', $responseSort->json('data.2.name'));

        $responseSortDesc = $this->actingAs($this->user, 'api')->getJson('/api/publishers?sort_by=name&sort_order=desc');
        $responseSortDesc->assertStatus(200);
        $this->assertEquals('Publisher C', $responseSortDesc->json('data.0.name'));
        $this->assertEquals('Publisher B', $responseSortDesc->json('data.1.name'));
        $this->assertEquals('Publisher A', $responseSortDesc->json('data.2.name'));
    }

    /**
     * Test unauthorized request to publisher endpoints.
     */
    public function test_publisher_endpoints_require_authentication(): void
    {
        $response = $this->postJson('/api/publishers', [
            'name' => 'Some Publisher',
        ]);

        $response->assertStatus(401);

        $responseList = $this->getJson('/api/publishers');
        $responseList->assertStatus(401);
    }
}
