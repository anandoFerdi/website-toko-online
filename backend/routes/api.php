<?php

use App\Http\Controllers\AIController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BrandController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\TestimonialController;
use Illuminate\Support\Facades\Route;

// Midtrans Webhook (public, no auth needed - Midtrans calls this)
Route::post('/midtrans/notification', [OrderController::class, 'handleNotification']);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/testimonials', [TestimonialController::class, 'index']);

Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/trending', [ProductController::class, 'trending']);
Route::get('/products/{id}', [ProductController::class, 'show']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/categories/{id}', [CategoryController::class, 'show']);

Route::get('/brands', [BrandController::class, 'index']);
Route::get('/brands/{id}', [BrandController::class, 'show']);

// Public AI Features (Guest can use)
Route::post('/ai/chat', [AIController::class, 'chat']);
Route::post('/ai/build', [AIController::class, 'generateBuild']);
Route::post('/ai/compatibility', [AIController::class, 'checkCompatibility']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/testimonials', [TestimonialController::class, 'store']);
    
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/me', [AuthController::class, 'updateProfile']);
    Route::put('/me/email', [AuthController::class, 'changeEmail']);
    Route::put('/me/password', [AuthController::class, 'changePassword']);
    Route::delete('/me', [AuthController::class, 'deleteAccount']);

    // Cart
    Route::get('/cart', [CartController::class, 'index']);
    Route::post('/cart', [CartController::class, 'store']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);
    Route::delete('/cart/clear', [CartController::class, 'clear']);

    // Orders
    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
    Route::post('/orders/{id}/refresh-payment', [OrderController::class, 'refreshPayment']);
    Route::post('/orders/{id}/sync-payment', [OrderController::class, 'syncPayment']);
    Route::get('/orders/{id}/invoice', [OrderController::class, 'downloadInvoice']);

    // Admin Routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        // AI History (Admin only)
        Route::get('/ai/history', [AIController::class, 'chatHistory']);
        Route::get('/ai/history/{sessionId}', [AIController::class, 'sessionHistory']);

        // Products CRUD
        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);

        // Categories CRUD
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Brands CRUD
        Route::post('/brands', [BrandController::class, 'store']);
        Route::put('/brands/{id}', [BrandController::class, 'update']);
        Route::delete('/brands/{id}', [BrandController::class, 'destroy']);

        // Orders Management
        Route::get('/orders', [OrderController::class, 'adminIndex']);
        Route::put('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        
        // Users Management
        Route::get('/users', [\App\Http\Controllers\UserController::class, 'index']);
        Route::post('/users', [\App\Http\Controllers\UserController::class, 'store']);
        Route::put('/users/{id}', [\App\Http\Controllers\UserController::class, 'update']);
        Route::delete('/users/{id}', [\App\Http\Controllers\UserController::class, 'destroy']);
    });
});
