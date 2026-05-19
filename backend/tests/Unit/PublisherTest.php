<?php

namespace Tests\Unit;

use App\Models\Publisher;
use App\Models\Book;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class PublisherTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test Publisher factory creates a valid publisher.
     */
    public function test_publisher_factory_creates_valid_model(): void
    {
        $publisher = Publisher::factory()->create();

        $this->assertInstanceOf(Publisher::class, $publisher);
        $this->assertNotNull($publisher->name);
    }

    /**
     * Test Publisher has many Books relationship.
     */
    public function test_publisher_has_many_books_relationship(): void
    {
        $publisher = Publisher::factory()->create();
        $book1 = Book::factory()->create(['publisher_id' => $publisher->id]);
        $book2 = Book::factory()->create(['publisher_id' => $publisher->id]);

        $this->assertTrue($publisher->books->contains($book1));
        $this->assertTrue($publisher->books->contains($book2));
        $this->assertEquals(2, $publisher->books->count());
    }
}
