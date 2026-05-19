<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Publisher;
use App\Models\Book;
use App\Models\User;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BookTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private Author $author;
    private Publisher $publisher;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create();
        $this->author = Author::factory()->create(['name' => 'Author One']);
        $this->publisher = Publisher::factory()->create(['name' => 'Publisher One']);
    }

    /**
     * Test creating a book successfully.
     */
    public function test_create_book_success(): void
    {
        $response = $this->actingAs($this->user, 'api')->postJson('/api/books', [
            'title' => 'The Great Book',
            'description' => 'A wonderful book description.',
            'release_date' => '2026-05-19',
            'stock' => 15,
            'price' => 29.99,
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'status',
                'message',
                'data' => [
                    'id',
                    'title',
                    'description',
                    'release_date',
                    'stock',
                    'price',
                    'author_id',
                    'publisher_id',
                    'author_name',
                    'publisher_name',
                    'author' => ['id', 'name'],
                    'publisher' => ['id', 'name'],
                    'created_at',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'message' => 'Book successfully created',
                'data' => [
                    'title' => 'The Great Book',
                    'description' => 'A wonderful book description.',
                    'release_date' => '2026-05-19',
                    'stock' => 15,
                    'price' => 29.99,
                    'author_id' => $this->author->id,
                    'publisher_id' => $this->publisher->id,
                    'author_name' => 'Author One',
                    'publisher_name' => 'Publisher One',
                ]
            ]);

        $this->assertDatabaseHas('books', [
            'title' => 'The Great Book',
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);
    }

    /**
     * Test validation error when creating a book.
     */
    public function test_create_book_validation_error(): void
    {
        // 1. Missing required fields
        $response1 = $this->actingAs($this->user, 'api')->postJson('/api/books', [
            'description' => 'Missing fields',
        ]);

        $response1->assertStatus(422)
            ->assertJsonValidationErrors(['title', 'stock', 'price', 'author_id', 'publisher_id']);

        // 2. Negative price and stock
        $response2 = $this->actingAs($this->user, 'api')->postJson('/api/books', [
            'title' => 'Negative values',
            'stock' => -5,
            'price' => -10.00,
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['stock', 'price']);
    }

    /**
     * Test relationship validation with author and publisher.
     */
    public function test_book_relationship_validation(): void
    {
        // Invalid (non-existent) author_id and publisher_id
        $response = $this->actingAs($this->user, 'api')->postJson('/api/books', [
            'title' => 'Invalid Relations Book',
            'stock' => 10,
            'price' => 15.00,
            'author_id' => 9999, // non-existent
            'publisher_id' => 8888, // non-existent
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['author_id', 'publisher_id']);
    }

    /**
     * Test getting a single book.
     */
    public function test_get_single_book_success(): void
    {
        $book = Book::factory()->create([
            'title' => 'Specific Book Title',
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $response = $this->actingAs($this->user, 'api')->getJson("/api/books/{$book->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'data' => [
                    'id',
                    'title',
                    'description',
                    'release_date',
                    'stock',
                    'price',
                    'author_id',
                    'publisher_id',
                    'author_name',
                    'publisher_name',
                    'author' => ['id', 'name'],
                    'publisher' => ['id', 'name'],
                    'created_at',
                ]
            ])
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'id' => $book->id,
                    'title' => 'Specific Book Title',
                ]
            ]);
    }

    /**
     * Test getting a single book returns 404 if not found.
     */
    public function test_get_single_book_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->getJson('/api/books/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Book not found',
            ]);
    }

    /**
     * Test updating a book successfully.
     */
    public function test_update_book_success(): void
    {
        $book = Book::factory()->create([
            'title' => 'Original Title',
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $newAuthor = Author::factory()->create(['name' => 'New Author Name']);

        $response = $this->actingAs($this->user, 'api')->putJson("/api/books/{$book->id}", [
            'title' => 'Updated Title',
            'stock' => 50,
            'price' => 39.99,
            'author_id' => $newAuthor->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Book successfully updated',
                'data' => [
                    'id' => $book->id,
                    'title' => 'Updated Title',
                    'stock' => 50,
                    'price' => 39.99,
                    'author_id' => $newAuthor->id,
                    'author_name' => 'New Author Name',
                ]
            ]);

        $this->assertDatabaseHas('books', [
            'id' => $book->id,
            'title' => 'Updated Title',
            'author_id' => $newAuthor->id,
        ]);
    }

    /**
     * Test updating a non-existing book returns 404.
     */
    public function test_update_book_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->putJson('/api/books/999', [
            'title' => 'New Title',
            'stock' => 10,
            'price' => 12.50,
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Book not found',
            ]);
    }

    /**
     * Test deleting a book successfully.
     */
    public function test_delete_book_success(): void
    {
        $book = Book::factory()->create();

        $response = $this->actingAs($this->user, 'api')->deleteJson("/api/books/{$book->id}");

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'message' => 'Book successfully deleted',
            ]);

        $this->assertDatabaseMissing('books', [
            'id' => $book->id,
        ]);
    }

    /**
     * Test deleting a non-existing book returns 404.
     */
    public function test_delete_book_not_found(): void
    {
        $response = $this->actingAs($this->user, 'api')->deleteJson('/api/books/999');

        $response->assertStatus(404)
            ->assertJson([
                'status' => 'error',
                'message' => 'Book not found',
            ]);
    }

    /**
     * Test getting the book list (pagination, search, filtering, and sorting).
     */
    public function test_get_book_list_and_response_features(): void
    {
        $author2 = Author::factory()->create();
        $publisher2 = Publisher::factory()->create();

        // Seed books for filtering tests
        Book::factory()->count(10)->create([
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        Book::factory()->count(5)->create([
            'author_id' => $author2->id,
            'publisher_id' => $publisher2->id,
        ]);

        // 1. Check basic pagination and structure
        $response = $this->actingAs($this->user, 'api')->getJson('/api/books');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'description',
                        'release_date',
                        'stock',
                        'price',
                        'author_id',
                        'publisher_id',
                        'author_name',
                        'publisher_name',
                        'author' => ['id', 'name'],
                        'publisher' => ['id', 'name'],
                        'created_at',
                    ]
                ],
                'links' => ['first', 'last', 'prev', 'next'],
                'meta' => ['current_page', 'last_page', 'per_page', 'total']
            ]);

        $this->assertCount(10, $response->json('data')); // default pagination is 10
        $this->assertEquals(15, $response->json('meta.total'));

        // 2. Filter by author_id
        $responseAuthorFilter = $this->actingAs($this->user, 'api')->getJson("/api/books?author_id={$author2->id}");
        $responseAuthorFilter->assertStatus(200);
        $this->assertCount(5, $responseAuthorFilter->json('data'));

        // 3. Filter by publisher_id
        $responsePublisherFilter = $this->actingAs($this->user, 'api')->getJson("/api/books?publisher_id={$this->publisher->id}");
        $responsePublisherFilter->assertStatus(200);
        $this->assertCount(10, $responsePublisherFilter->json('data'));

        // 4. Search by title
        Book::factory()->create([
            'title' => 'UniqueBookXYZ',
            'description' => 'A unique book description',
            'author_id' => $this->author->id,
            'publisher_id' => $this->publisher->id,
        ]);

        $responseSearch = $this->actingAs($this->user, 'api')->getJson('/api/books?search=UniqueBookXYZ');
        $responseSearch->assertStatus(200);
        $this->assertCount(1, $responseSearch->json('data'));
        $this->assertEquals('UniqueBookXYZ', $responseSearch->json('data.0.title'));

        // 5. Check sorting functionality
        Book::query()->delete();
        Book::factory()->create(['title' => 'Book B', 'author_id' => $this->author->id, 'publisher_id' => $this->publisher->id]);
        Book::factory()->create(['title' => 'Book A', 'author_id' => $this->author->id, 'publisher_id' => $this->publisher->id]);
        Book::factory()->create(['title' => 'Book C', 'author_id' => $this->author->id, 'publisher_id' => $this->publisher->id]);

        $responseSort = $this->actingAs($this->user, 'api')->getJson('/api/books?sort_by=title&sort_order=asc');
        $responseSort->assertStatus(200);
        $this->assertEquals('Book A', $responseSort->json('data.0.title'));
        $this->assertEquals('Book B', $responseSort->json('data.1.title'));
        $this->assertEquals('Book C', $responseSort->json('data.2.title'));

        $responseSortDesc = $this->actingAs($this->user, 'api')->getJson('/api/books?sort_by=title&sort_order=desc');
        $responseSortDesc->assertStatus(200);
        $this->assertEquals('Book C', $responseSortDesc->json('data.0.title'));
        $this->assertEquals('Book B', $responseSortDesc->json('data.1.title'));
        $this->assertEquals('Book A', $responseSortDesc->json('data.2.title'));
    }

    /**
     * Test unauthorized request to book endpoints.
     */
    public function test_book_endpoints_require_authentication(): void
    {
        $response = $this->postJson('/api/books', [
            'title' => 'Unauthorized Title',
        ]);

        $response->assertStatus(401);

        $responseList = $this->getJson('/api/books');
        $responseList->assertStatus(401);
    }
}
