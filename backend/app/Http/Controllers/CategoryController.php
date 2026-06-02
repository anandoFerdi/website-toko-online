<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('products')->orderBy('name')->get();
        return response()->json($categories);
    }

    public function show($id): JsonResponse
    {
        $category = Category::withCount('products')->findOrFail($id);
        return response()->json($category);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:categories,name',
            'icon'        => 'nullable|string',
            'description' => 'nullable|string',
        ]);
        $validated['slug'] = Str::slug($validated['name']);
        $category = Category::create($validated);
        return response()->json($category, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $category = Category::findOrFail($id);
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255|unique:categories,name,' . $id,
            'icon'        => 'nullable|string',
            'description' => 'nullable|string',
        ]);
        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        $category->update($validated);
        return response()->json($category);
    }

    public function destroy($id): JsonResponse
    {
        Category::findOrFail($id)->delete();
        return response()->json(['message' => 'Category deleted']);
    }
}
