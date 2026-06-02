<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'brand'])->where('is_active', true);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }

        if ($request->filled('brand')) {
            $query->whereHas('brand', fn($q) => $q->where('slug', $request->brand));
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->min_price);
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->max_price);
        }

        $sort = $request->get('sort', 'created_at');
        $order = $request->get('order', 'desc');
        $allowedSorts = ['name', 'price', 'rating', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order === 'asc' ? 'asc' : 'desc');
        }

        $perPage = min($request->get('per_page', 12), 50);
        $products = $query->paginate($perPage);

        return response()->json($products);
    }

    public function show($id): JsonResponse
    {
        $product = Product::with(['category', 'brand'])->findOrFail($id);
        return response()->json($product);
    }

    public function trending(): JsonResponse
    {
        $products = Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('is_trending', true)
            ->orderBy('rating', 'desc')
            ->take(8)
            ->get();

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id'  => 'required|exists:categories,id',
            'brand_id'     => 'required|exists:brands,id',
            'name'         => 'required|string|max:255',
            'description'  => 'required|string',
            'specs'        => 'nullable|array',
            'compatibility'=> 'nullable|array',
            'price'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'image'        => 'nullable|string',
            'is_trending'  => 'boolean',
            'is_active'    => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);

        $product = Product::create($validated);
        return response()->json($product->load(['category', 'brand']), 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'category_id'  => 'sometimes|exists:categories,id',
            'brand_id'     => 'sometimes|exists:brands,id',
            'name'         => 'sometimes|string|max:255',
            'description'  => 'sometimes|string',
            'specs'        => 'nullable|array',
            'compatibility'=> 'nullable|array',
            'price'        => 'sometimes|numeric|min:0',
            'stock'        => 'sometimes|integer|min:0',
            'image'        => 'nullable|string',
            'is_trending'  => 'boolean',
            'is_active'    => 'boolean',
        ]);

        if (isset($validated['name'])) {
            $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(6);
        }

        $product->update($validated);
        return response()->json($product->load(['category', 'brand']));
    }

    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
