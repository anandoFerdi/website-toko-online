<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $cartItems = Cart::with(['product.category', 'product.brand'])
            ->where('user_id', $request->user()->id)
            ->get();

        $total = $cartItems->sum(fn($item) => $item->quantity * $item->product->price);

        return response()->json([
            'items' => $cartItems,
            'total' => $total,
            'count' => $cartItems->sum('quantity'),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity'   => 'required|integer|min:1|max:99',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        if ($product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        $cartItem = Cart::where('user_id', $request->user()->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($cartItem) {
            $newQuantity = min($cartItem->quantity + $validated['quantity'], $product->stock);
            $cartItem->update(['quantity' => $newQuantity]);
        } else {
            $cartItem = Cart::create([
                'user_id' => $request->user()->id,
                'product_id' => $validated['product_id'],
                'quantity' => min($validated['quantity'], $product->stock)
            ]);
        }

        return response()->json($cartItem->load('product'), 201);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $cartItem = Cart::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $validated = $request->validate([
            'quantity' => 'required|integer|min:1|max:99',
        ]);

        if ($cartItem->product->stock < $validated['quantity']) {
            return response()->json(['message' => 'Insufficient stock'], 422);
        }

        $cartItem->update($validated);
        return response()->json($cartItem->load('product'));
    }

    public function destroy(Request $request, $id): JsonResponse
    {
        Cart::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->firstOrFail()
            ->delete();

        return response()->json(['message' => 'Item removed from cart']);
    }

    public function clear(Request $request): JsonResponse
    {
        Cart::where('user_id', $request->user()->id)->delete();
        return response()->json(['message' => 'Cart cleared']);
    }
}
