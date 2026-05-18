<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Author;
use App\Models\Publisher;
use App\Models\Book;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Admin User
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
        ]);

        // 2. Create 10 Authors
        $authors = Author::factory(10)->create();

        // 3. Create 5 Publishers
        $publishers = Publisher::factory(5)->create();

        // 4. Create 30 Books
        for ($i = 0; $i < 30; $i++) {
            Book::factory()->create([
                'author_id' => $authors->random()->id,
                'publisher_id' => $publishers->random()->id,
            ]);
        }
    }
}
