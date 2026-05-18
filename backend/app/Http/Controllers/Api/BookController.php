<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Book;
use App\Http\Resources\BookResource;
use App\Http\Requests\StoreBookRequest;

class BookController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Book::with(['author', 'publisher']);

        // 1. Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // 2. Filters
        if ($request->filled('author_id')) {
            $query->where('author_id', $request->input('author_id'));
        }

        if ($request->filled('publisher_id')) {
            $query->where('publisher_id', $request->input('publisher_id'));
        }

        // 3. Sorting
        $sortBy = $request->input('sort_by', 'title');
        $sortOrder = $request->input('sort_order', 'asc');
        $allowedSortFields = ['id', 'title', 'release_date', 'stock', 'price', 'created_at'];

        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('title', 'asc');
        }

        // 4. Pagination
        $perPage = $request->input('per_page', 10);
        $books = $query->paginate($perPage);

        return BookResource::collection($books);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBookRequest $request)
    {
        $book = Book::create($request->validated());
        
        // Eager load relations for resource response
        $book->load(['author', 'publisher']);

        return response()->json([
            'status' => 'success',
            'message' => 'Book successfully created',
            'data' => new BookResource($book)
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $book = Book::with(['author', 'publisher'])->find($id);

        if (!$book) {
            return response()->json([
                'status' => 'error',
                'message' => 'Book not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => new BookResource($book)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StoreBookRequest $request, $id)
    {
        $book = Book::find($id);

        if (!$book) {
            return response()->json([
                'status' => 'error',
                'message' => 'Book not found'
            ], 404);
        }

        $book->update($request->validated());
        $book->load(['author', 'publisher']);

        return response()->json([
            'status' => 'success',
            'message' => 'Book successfully updated',
            'data' => new BookResource($book)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $book = Book::find($id);

        if (!$book) {
            return response()->json([
                'status' => 'error',
                'message' => 'Book not found'
            ], 404);
        }

        $book->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Book successfully deleted'
        ]);
    }
}
