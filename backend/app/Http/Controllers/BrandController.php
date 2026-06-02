<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class BrandController extends Controller
{
    public function index(): JsonResponse
    {
        $brands = Brand::withCount('products')->orderBy('name')->get();
        return response()->json($brands);
    }

    public function show($id): JsonResponse
    {
        $brand = Brand::withCount('products')->findOrFail($id);
        return response()->json($brand);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:brands,name',
            'logo'        => 'nullable|string',
            'description' => 'nullable|string',
        ]);
        $validated['slug'] = Str::slug($validated['name']);
        $brand = Brand::create($validated);
        return response()->json($brand, 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $brand = Brand::findOrFail($id);
        $validated = $request->validate([
            'name'        => 'sometimes|string|max:255|unique:brands,name,' . $id,
            'logo'        => 'nullable|string',
            'description' => 'nullable|string',
        ]);
        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']);
        }
        $brand->update($validated);
        return response()->json($brand);
    }

    public function destroy($id): JsonResponse
    {
        Brand::findOrFail($id)->delete();
        return response()->json(['message' => 'Brand deleted']);
    }
}
