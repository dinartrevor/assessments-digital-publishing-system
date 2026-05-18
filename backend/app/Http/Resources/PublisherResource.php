<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublisherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'address' => $this->address,
            'phone' => $this->phone,
            'books_count' => $this->books_count ?? ($this->relationLoaded('books') ? $this->books->count() : $this->books()->count()),
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
