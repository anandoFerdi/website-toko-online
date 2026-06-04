<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

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
        $request->validate([
            'category_id'  => 'required|exists:categories,id',
            'brand_id'     => 'required|exists:brands,id',
            'name'         => 'required|string|max:255',
            'description'  => 'required|string',
            'specs'        => 'nullable',
            'compatibility'=> 'nullable',
            'price'        => 'required|numeric|min:0',
            'stock'        => 'required|integer|min:0',
            'image_file'   => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
            'image'        => 'nullable|string',
            'is_trending'  => 'nullable',
            'is_active'    => 'nullable',
        ]);

        $data = $request->only([
            'category_id', 'brand_id', 'name', 'description', 'price', 'stock'
        ]);

        // Handle image: file upload takes priority over URL string
        if ($request->hasFile('image_file')) {
            $path = $request->file('image_file')->store('products', 'public');
            $data['image'] = url('storage/' . $path);
        } elseif ($request->filled('image')) {
            $data['image'] = $request->input('image');
        }

        // Parse JSON strings for specs and compatibility
        $data['specs'] = $this->parseJsonField($request->input('specs'));
        $data['compatibility'] = $this->parseJsonField($request->input('compatibility'));

        // Handle booleans from FormData (sent as strings)
        $data['is_trending'] = filter_var($request->input('is_trending', false), FILTER_VALIDATE_BOOLEAN);
        $data['is_active'] = filter_var($request->input('is_active', true), FILTER_VALIDATE_BOOLEAN);

        $data['slug'] = Str::slug($data['name']) . '-' . Str::random(6);

        $product = Product::create($data);
        return response()->json($product->load(['category', 'brand']), 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $product = Product::findOrFail($id);

        $request->validate([
            'category_id'  => 'sometimes|exists:categories,id',
            'brand_id'     => 'sometimes|exists:brands,id',
            'name'         => 'sometimes|string|max:255',
            'description'  => 'sometimes|string',
            'specs'        => 'nullable',
            'compatibility'=> 'nullable',
            'price'        => 'sometimes|numeric|min:0',
            'stock'        => 'sometimes|integer|min:0',
            'image_file'   => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:2048',
            'image'        => 'nullable|string',
            'remove_image' => 'nullable',
            'is_trending'  => 'nullable',
            'is_active'    => 'nullable',
        ]);

        $data = $request->only([
            'category_id', 'brand_id', 'name', 'description', 'price', 'stock'
        ]);

        // Handle image
        if ($request->hasFile('image_file')) {
            $this->deleteOldImage($product->image);
            $path = $request->file('image_file')->store('products', 'public');
            $data['image'] = url('storage/' . $path);
        } elseif (filter_var($request->input('remove_image'), FILTER_VALIDATE_BOOLEAN)) {
            $this->deleteOldImage($product->image);
            $data['image'] = null;
        } elseif ($request->filled('image')) {
            $data['image'] = $request->input('image');
        }

        // Parse JSON strings
        if ($request->has('specs')) {
            $data['specs'] = $this->parseJsonField($request->input('specs'));
        }
        if ($request->has('compatibility')) {
            $data['compatibility'] = $this->parseJsonField($request->input('compatibility'));
        }

        // Handle booleans
        if ($request->has('is_trending')) {
            $data['is_trending'] = filter_var($request->input('is_trending'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }

        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']) . '-' . Str::random(6);
        }

        $product->update($data);
        return response()->json($product->load(['category', 'brand']));
    }

    public function destroy($id): JsonResponse
    {
        $product = Product::findOrFail($id);
        $this->deleteOldImage($product->image);
        $product->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }

    /**
     * Parse a JSON string field, returning null for empty values.
     */
    private function parseJsonField($value)
    {
        if (is_null($value) || (is_string($value) && empty(trim($value)))) {
            return null;
        }
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value)) {
            return json_decode($value, true);
        }
        return null;
    }

    /**
     * Delete an old product image from storage if it's a locally uploaded file.
     */
    private function deleteOldImage(?string $imageUrl): void
    {
        if ($imageUrl && str_contains($imageUrl, '/storage/products/')) {
            $path = 'products/' . basename($imageUrl);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }
}
