<?php

namespace Tests\Unit;

use App\Models\Author;
use App\Models\Book;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthorTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Author factory creates a valid author.
     */
    public function test_author_factory_creates_valid_model(): void
    {
        $author = Author::factory()->create();

        $this->assertInstanceOf(Author::class, $author);
        $this->assertNotNull($author->name);
    }

    /**
     * Test Author has many Books relationship.
     */
    public function test_author_has_many_books_relationship(): void
    {
        $author = Author::factory()->create();
        $book1 = Book::factory()->create(['author_id' => $author->id]);
        $book2 = Book::factory()->create(['author_id' => $author->id]);

        $this->assertTrue($author->books->contains($book1));
        $this->assertTrue($author->books->contains($book2));
        $this->assertEquals(2, $author->books->count());
    }
}
