<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookResource extends JsonResource
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
            'title' => $this->title,
            'description' => $this->description,
            'release_date' => $this->release_date,
            'stock' => (int) $this->stock,
            'price' => (float) $this->price,
            'author_id' => $this->author_id,
            'publisher_id' => $this->publisher_id,
            'author_name' => $this->author?->name,
            'publisher_name' => $this->publisher?->name,
            'author' => $this->relationLoaded('author') && $this->author ? [
                'id' => $this->author->id,
                'name' => $this->author->name,
            ] : null,
            'publisher' => $this->relationLoaded('publisher') && $this->publisher ? [
                'id' => $this->publisher->id,
                'name' => $this->publisher->name,
            ] : null,
            'created_at' => $this->created_at ? $this->created_at->toIso8601String() : null,
        ];
    }
}
