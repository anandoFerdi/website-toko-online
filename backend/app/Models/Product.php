<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id', 'brand_id', 'name', 'slug', 'description',
        'specs', 'compatibility', 'price', 'stock', 'weight', 'image',
        'rating', 'review_count', 'is_trending', 'is_active',
    ];

    protected $casts = [
        'specs'          => 'array',
        'compatibility'  => 'array',
        'price'          => 'decimal:2',
        'rating'         => 'decimal:2',
        'weight'         => 'integer',
        'is_trending'    => 'boolean',
        'is_active'      => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function brand()
    {
        return $this->belongsTo(Brand::class);
    }

    public function carts()
    {
        return $this->hasMany(Cart::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }

    public function getImageAttribute($value)
    {
        if ($value && str_starts_with($value, '/storage/')) {
            return rtrim(config('app.url'), '/') . $value;
        }
        return $value;
    }
}
