<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Publisher;
use App\Http\Resources\PublisherResource;
use App\Http\Requests\StorePublisherRequest;

class PublisherController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Publisher::query();

        // 1. Search
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('address', 'like', "%{$search}%");
            });
        }

        // 2. Sorting
        $sortBy = $request->input('sort_by', 'name');
        $sortOrder = $request->input('sort_order', 'asc');
        $allowedSortFields = ['id', 'name', 'created_at'];

        if (in_array($sortBy, $allowedSortFields)) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        } else {
            $query->orderBy('name', 'asc');
        }

        // 3. Pagination
        $perPage = $request->input('per_page', 10);
        $publishers = $query->withCount('books')->paginate($perPage);

        return PublisherResource::collection($publishers);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePublisherRequest $request)
    {
        $publisher = Publisher::create($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Publisher successfully created',
            'data' => new PublisherResource($publisher)
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        $publisher = Publisher::withCount('books')->find($id);

        if (!$publisher) {
            return response()->json([
                'status' => 'error',
                'message' => 'Publisher not found'
            ], 404);
        }

        return response()->json([
            'status' => 'success',
            'data' => new PublisherResource($publisher)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(StorePublisherRequest $request, $id)
    {
        $publisher = Publisher::find($id);

        if (!$publisher) {
            return response()->json([
                'status' => 'error',
                'message' => 'Publisher not found'
            ], 404);
        }

        $publisher->update($request->validated());

        return response()->json([
            'status' => 'success',
            'message' => 'Publisher successfully updated',
            'data' => new PublisherResource($publisher)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $publisher = Publisher::find($id);

        if (!$publisher) {
            return response()->json([
                'status' => 'error',
                'message' => 'Publisher not found'
            ], 404);
        }

        $publisher->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Publisher successfully deleted'
        ]);
    }
}
