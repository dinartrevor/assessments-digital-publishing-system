<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthorTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
    }

    /**
     * Test creating an author successfully.
     */
    public function test_create_author_success(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/authors', [
            'name' => 'Jane Austen',
            'bio' => 'A famous English novelist.',
            'birth_date' => '1775-12-16',
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'name',
                    'bio',
                    'birth_date',
                    'books_count',
                    'created_at',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'message' => 'Author successfully created',
                'data' => [
                    'name' => 'Jane Austen',
                    'bio' => 'A famous English novelist.',
                    'birth_date' => '1775-12-16',
                    'books_count' => 0,
                ]
            ]);

        $this->assertDatabaseHas('authors', [
            'name' => 'Jane Austen',
            'birth_date' => '1775-12-16',
        ]);
    }

    /**
     * Test validation error when creating an author.
     */
    public function test_create_author_validation_error(): void
    {
        // 1. Missing required 'name' field
        $response1 = $this->actingAs($this->user, 'api')->postJson('/api/authors', [
            'bio' => 'Short bio',
            'birth_date' => '1990-01-01',
        ]);

        $response1->assertStatus(422)
            ->assertJsonValidationErrors(['name']);

        // 2. Invalid 'birth_date' (must be before today)
        $response2 = $this->actingAs($this->user, 'api')->postJson('/api/authors', [
            'name' => 'John Doe',
            'birth_date' => now()->addDay()->format('Y-m-d'),
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['birth_date']);
    }

    /**
     * Test getting a single author.
     */
    public function test_get_single_author_success(): void
    {
        $author = Author::factory()->create([
            'name' => 'Leo Tolstoy',
            'bio' => 'Russian writer',
        ]);

        $response = $this->actingAs($this->user, 'api')->getJson("/api/authors/{$author->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'id',
                    'name',
                    'bio',
                    'birth_date',
                    'books_count',
                    'created_at',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $author->id,
                    'name' => 'Leo Tolstoy',
                    'bio' => 'Russian writer',
                ]
            ]);
    }

    /**
     * Test getting a single author returns 404 if not found.
     */
    public function test_get_single_author_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->getJson('/api/authors/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Author not found',
            ]);
    }

    /**
     * Test updating an author successfully.
     */
    public function test_update_author_success(): void
    {
        $author = Author::factory()->create([
            'name' => 'Leo Tolstoy',
            'bio' => 'Russian writer',
        ]);

        $response = $this->actingAs($this->user, 'api')->putJson("/api/authors/{$author->id}", [
            'name' => 'Leo Tolstoy (Updated)',
            'bio' => 'Great Russian writer',
            'birth_date' => '1828-09-09',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Author successfully updated',
                'data' => [
                    'id' => $author->id,
                    'name' => 'Leo Tolstoy (Updated)',
                    'bio' => 'Great Russian writer',
                    'birth_date' => '1828-09-09',
                ]
            ]);

        $this->assertDatabaseHas('authors', [
            'id' => $author->id,
            'name' => 'Leo Tolstoy (Updated)',
        ]);
    }

    /**
     * Test updating a non-existing author returns 404.
     */
    public function test_update_author_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->putJson('/api/authors/999', [
            'name' => 'New Name',
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Author not found',
            ]);
    }

    /**
     * Test deleting an author successfully.
     */
    public function test_delete_author_success(): void
    {
        $author = Author::factory()->create();

        $response = $this->actingAs($this->user, 'api')->deleteJson("/api/authors/{$author->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Author successfully deleted',
            ]);

        $this->assertDatabaseMissing('authors', [
            'id' => $author->id,
        ]);
    }

    /**
     * Test deleting a non-existing author returns 404.
     */
    public function test_delete_author_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->deleteJson('/api/authors/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Author not found',
            ]);
    }

    /**
     * Test getting the author list (pagination, search, filtering, and sorting).
     */
    public function test_get_author_list_and_response_features(): void
    {
        // Seed 15 authors
        Author::factory()->count(15)->create();

        // 1. Check basic pagination and structure
        $response = $this->actingAs($this->user, 'api')->getJson('/api/authors');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'bio',
                        'birth_date',
                        'books_count',
                        'created_at',
                    ]
                ],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'last_page', 'per_page', 'total']
            ]);

        $this->assertCount(10, $response->json('data')); // default pagination is 10
        $this->assertEquals(15, $response->json('meta.total'));

        // 2. Check custom pagination
        $responseCustom = $this->actingAs($this->user, 'api')->getJson('/api/authors?per_page=5');
        $responseCustom->assertStatus(200);
        $this->assertCount(5, $responseCustom->json('data'));

        // 3. Check search functionality
        Author::factory()->create([
            'name' => 'UniqueAuthorNameXYZ',
            'bio' => 'Some unique bio search term',
        ]);

        $responseSearch = $this->actingAs($this->user, 'api')->getJson('/api/authors?search=UniqueAuthorNameXYZ');
        $responseSearch->assertStatus(200);
        $this->assertCount(1, $responseSearch->json('data'));
        $this->assertEquals('UniqueAuthorNameXYZ', $responseSearch->json('data.0.name'));

        // 4. Check sorting functionality
        Author::query()->delete();
        Author::factory()->create(['name' => 'Author B']);
        Author::factory()->create(['name' => 'Author A']);
        Author::factory()->create(['name' => 'Author C']);

        $responseSort = $this->actingAs($this->user, 'api')->getJson('/api/authors?sort_by=name&sort_order=asc');
        $responseSort->assertStatus(200);
        $this->assertEquals('Author A', $responseSort->json('data.0.name'));
        $this->assertEquals('Author B', $responseSort->json('data.1.name'));
        $this->assertEquals('Author C', $responseSort->json('data.2.name'));

        $responseSortDesc = $this->actingAs($this->user, 'api')->getJson('/api/authors?sort_by=name&sort_order=desc');
        $responseSortDesc->assertStatus(200);
        $this->assertEquals('Author C', $responseSortDesc->json('data.0.name'));
        $this->assertEquals('Author B', $responseSortDesc->json('data.1.name'));
        $this->assertEquals('Author A', $responseSortDesc->json('data.2.name'));
    }

    /**
     * Test unauthorized request to author endpoints.
     */
    public function test_author_endpoints_require_authentication(): void
    {
        $response = $this->postJson('/api/authors', [
            'name' => 'Jane Doe',
        ]);

        $response->assertStatus(401);

        $responseList = $this->getJson('/api/authors');
        $responseList->assertStatus(401);
    }
}
