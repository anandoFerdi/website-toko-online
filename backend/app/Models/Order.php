<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'order_number', 'subtotal', 'shipping_cost', 'total_price',
        'status', 'payment_status', 'payment_method', 'midtrans_order_id',
        'midtrans_token', 'shipping_address', 'recipient_name', 'recipient_phone', 'notes',
        // Biteship / shipping fields
        'biteship_order_id', 'biteship_waybill_id',
        'courier_company', 'courier_service', 'courier_service_name',
        'shipping_province', 'shipping_city', 'shipping_district',
        'shipping_village', 'shipping_postal_code',
        'shipping_lat', 'shipping_lng', 'destination_area_id',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }
}
