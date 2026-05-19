<?php

namespace Tests\Unit;

use App\Models\Author;
use App\Models\Publisher;
use App\Models\Book;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class BookTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Book factory creates a valid book.
     */
    public function test_book_factory_creates_valid_model(): void
    {
        $book = Book::factory()->create();

        $this->assertInstanceOf(Book::class, $book);
        $this->assertNotNull($book->title);
        $this->assertNotNull($book->stock);
        $this->assertNotNull($book->price);
    }

    /**
     * Test Book belongs to Author relationship.
     */
    public function test_book_belongs_to_author_relationship(): void
    {
        $author = Author::factory()->create();
        $book = Book::factory()->create(['author_id' => $author->id]);

        $this->assertInstanceOf(Author::class, $book->author);
        $this->assertEquals($author->id, $book->author->id);
    }

    /**
     * Test Book belongs to Publisher relationship.
     */
    public function test_book_belongs_to_publisher_relationship(): void
    {
        $publisher = Publisher::factory()->create();
        $book = Book::factory()->create(['publisher_id' => $publisher->id]);

        $this->assertInstanceOf(Publisher::class, $book->publisher);
        $this->assertEquals($publisher->id, $book->publisher->id);
    }
}
