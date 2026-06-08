<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\BiteshipService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;
use Midtrans\Transaction;
use Barryvdh\DomPDF\Facade\Pdf;

class OrderController extends Controller
{
    protected BiteshipService $biteship;

    public function __construct(BiteshipService $biteship)
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = true;

        $this->biteship = $biteship;
    }

    public function index(Request $request): JsonResponse
    {
        $orders = Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($orders);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $order = Order::with('items.product')
            ->where('user_id', $request->user()->id)
            ->findOrFail($id);

        return response()->json($order);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipient_name'      => 'required|string|max:255',
            'recipient_phone'     => 'required|string|max:20',
            'shipping_address'    => 'required|string',
            'notes'               => 'nullable|string',

            // Structured address
            'shipping_province'   => 'nullable|string|max:100',
            'shipping_city'       => 'nullable|string|max:100',
            'shipping_district'   => 'nullable|string|max:100',
            'shipping_village'    => 'nullable|string|max:100',
            'shipping_postal_code'=> 'nullable|string|max:10',
            'shipping_lat'        => 'nullable|numeric',
            'shipping_lng'        => 'nullable|numeric',

            // Biteship
            'destination_area_id' => 'nullable|string',
            'courier_company'     => 'nullable|string|max:50',
            'courier_service'     => 'nullable|string|max:50',
            'courier_service_name'=> 'nullable|string|max:100',
            'shipping_cost'       => 'nullable|numeric|min:0',
        ]);

        $cartItems = Cart::with('product')
            ->where('user_id', $request->user()->id)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        return DB::transaction(function () use ($request, $validated, $cartItems) {
            $subtotal    = $cartItems->sum(fn($item) => $item->quantity * $item->product->price);
            $threshold   = (float) config('biteship.free_shipping_threshold', 500000);
            $shippingCost = $subtotal >= $threshold ? 0 : (float) ($validated['shipping_cost'] ?? 0);
            $total        = $subtotal + $shippingCost;
            $user         = $request->user();
            $orderNumber  = 'GK-' . strtoupper(Str::random(10));

            $order = Order::create([
                'user_id'              => $user->id,
                'order_number'         => $orderNumber,
                'subtotal'             => $subtotal,
                'shipping_cost'        => $shippingCost,
                'total_price'          => $total,
                'status'               => 'pending',
                'payment_status'       => 'unpaid',
                'payment_method'       => 'midtrans',
                'shipping_address'     => $validated['shipping_address'],
                'recipient_name'       => $validated['recipient_name'],
                'recipient_phone'      => $validated['recipient_phone'],
                'notes'                => $validated['notes'] ?? null,

                // Structured address
                'shipping_province'    => $validated['shipping_province'] ?? null,
                'shipping_city'        => $validated['shipping_city'] ?? null,
                'shipping_district'    => $validated['shipping_district'] ?? null,
                'shipping_village'     => $validated['shipping_village'] ?? null,
                'shipping_postal_code' => $validated['shipping_postal_code'] ?? null,
                'shipping_lat'         => $validated['shipping_lat'] ?? null,
                'shipping_lng'         => $validated['shipping_lng'] ?? null,

                // Biteship courier selection
                'destination_area_id'  => $validated['destination_area_id'] ?? null,
                'courier_company'      => $validated['courier_company'] ?? null,
                'courier_service'      => $validated['courier_service'] ?? null,
                'courier_service_name' => $validated['courier_service_name'] ?? null,
            ]);

            $itemDetails = [];
            foreach ($cartItems as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item->product_id,
                    'quantity'   => $item->quantity,
                    'price'      => $item->product->price,
                    'subtotal'   => $item->quantity * $item->product->price,
                ]);

                $item->product->decrement('stock', $item->quantity);

                $itemDetails[] = [
                    'id'       => $item->product_id,
                    'price'    => (int) $item->product->price,
                    'quantity' => $item->quantity,
                    'name'     => substr($item->product->name, 0, 50),
                ];
            }

            // Clear cart
            Cart::where('user_id', $user->id)->delete();

            // Build Midtrans transaction params
            $params = [
                'transaction_details' => [
                    'order_id'     => $orderNumber,
                    'gross_amount' => (int) $total,
                ],
                'item_details'     => $itemDetails,
                'customer_details' => [
                    'first_name' => $validated['recipient_name'],
                    'email'      => $user->email,
                    'phone'      => $validated['recipient_phone'],
                ],
            ];

            // Add shipping cost as line item for Midtrans if applicable
            if ($shippingCost > 0) {
                $params['item_details'][] = [
                    'id'       => 'SHIPPING',
                    'price'    => (int) $shippingCost,
                    'quantity' => 1,
                    'name'     => 'Ongkos Kirim (' . strtoupper($validated['courier_company'] ?? 'Kurir') . ')',
                ];
            }

            try {
                $snapToken = Snap::getSnapToken($params);
                $order->update(['midtrans_token' => $snapToken, 'midtrans_order_id' => $orderNumber]);
            } catch (\Exception $e) {
                Log::error('Midtrans Snap error: ' . $e->getMessage());
                return response()->json([
                    'message' => 'Gagal membuat sesi pembayaran Midtrans.',
                    'error'   => $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'order'      => $order->load('items.product'),
                'snap_token' => $snapToken,
            ], 201);
        });
    }

    /**
     * Handle Midtrans payment notification (webhook)
     */
    public function handleNotification(Request $request): JsonResponse
    {
        try {
            $notification = new Notification();

            $transactionStatus = $notification->transaction_status;
            $paymentType       = $notification->payment_type;
            $orderId           = $notification->order_id;
            $fraudStatus       = $notification->fraud_status;

            $order = Order::where('midtrans_order_id', $orderId)->first();

            if (!$order) {
                return response()->json(['message' => 'Order not found'], 404);
            }

            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'challenge') {
                    $order->update(['payment_status' => 'unpaid', 'status' => 'pending']);
                } elseif ($fraudStatus === 'accept') {
                    $order->update(['payment_status' => 'paid', 'status' => 'processing', 'payment_method' => $paymentType]);
                }
            } elseif ($transactionStatus === 'settlement') {
                $order->update(['payment_status' => 'paid', 'status' => 'processing', 'payment_method' => $paymentType]);
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                $order->update(['payment_status' => 'unpaid', 'status' => 'cancelled']);
            } elseif ($transactionStatus === 'pending') {
                $order->update(['payment_status' => 'unpaid', 'status' => 'pending']);
            }

            return response()->json(['message' => 'OK']);
        } catch (\Exception $e) {
            Log::error('Midtrans notification error: ' . $e->getMessage());
            return response()->json(['message' => 'Error processing notification'], 500);
        }
    }

    // Admin: list all orders
    public function adminIndex(Request $request): JsonResponse
    {
        $orders = Order::with(['user', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($orders);
    }

    /**
     * Admin: Update order status.
     * When status changes to 'shipped', automatically creates Biteship order and gets AWB.
     */
    public function updateStatus(Request $request, $id): JsonResponse
    {
        $order = Order::with('items.product')->findOrFail($id);

        $validated = $request->validate([
            'status'         => 'sometimes|in:pending,processing,shipped,delivered,cancelled',
            'payment_status' => 'sometimes|in:unpaid,paid,refunded',
        ]);

        $previousStatus = $order->status;
        $newStatus      = $validated['status'] ?? $previousStatus;

        // Auto-create Biteship shipment when changing to 'shipped'
        if ($newStatus === 'shipped' && $previousStatus !== 'shipped' && !$order->biteship_order_id) {
            if ($order->destination_area_id && $order->courier_company && $order->courier_service) {
                try {
                    $itemsData = $order->items->map(fn($item) => [
                        'product_id'   => $item->product_id,
                        'product_name' => $item->product?->name ?? 'Produk',
                        'price'        => (int) $item->price,
                        'weight'       => $item->product?->weight ?? 500,
                        'quantity'     => $item->quantity,
                    ])->toArray();

                    $biteshipResponse = $this->biteship->createOrder([
                        'order_number'         => $order->order_number,
                        'recipient_name'       => $order->recipient_name,
                        'recipient_phone'      => $order->recipient_phone,
                        'shipping_address'     => $order->shipping_address,
                        'notes'                => $order->notes,
                        'destination_area_id'  => $order->destination_area_id,
                        'shipping_postal_code'  => $order->shipping_postal_code,
                        'shipping_lat'         => $order->shipping_lat,
                        'shipping_lng'         => $order->shipping_lng,
                        'courier_company'      => $order->courier_company,
                        'courier_service'      => $order->courier_service,
                        'items'                => $itemsData,
                    ]);

                    $validated['biteship_order_id'] = $biteshipResponse['id'] ?? null;

                    // Biteship returns waybill_id nested under courier.waybill_id
                    // (not at root level — root waybill_id is usually null)
                    $waybillId = $biteshipResponse['courier']['waybill_id']
                        ?? $biteshipResponse['courier']['tracking_id']
                        ?? $biteshipResponse['waybill_id']
                        ?? null;
                    $validated['biteship_waybill_id'] = $waybillId;

                    Log::info('Biteship order created for order ' . $order->order_number
                        . ' | biteship_id=' . ($validated['biteship_order_id'] ?? '-')
                        . ' | waybill=' . ($waybillId ?? 'NULL')
                        . ' | raw=' . json_encode($biteshipResponse));
                } catch (\Exception $e) {
                    Log::error('Failed to create Biteship order for ' . $order->order_number . ': ' . $e->getMessage());
                    // Don't block the status update — just log the error
                }
            }
        }

        $order->update($validated);

        return response()->json([
            'order'   => $order->fresh(),
            'message' => $newStatus === 'shipped' && isset($validated['biteship_waybill_id'])
                ? 'Status diupdate dan resi ' . $validated['biteship_waybill_id'] . ' berhasil dibuat!'
                : 'Status berhasil diupdate.',
        ]);
    }

    public function cancel(Request $request, $id): JsonResponse
    {
        $order = Order::with('items.product')->where('user_id', $request->user()->id)->findOrFail($id);

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Pesanan sudah dibatalkan'], 400);
        }
        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Pesanan sudah dibayar tidak bisa dibatalkan'], 400);
        }

        return DB::transaction(function () use ($order) {
            $order->update([
                'status'         => 'cancelled',
                'payment_status' => 'unpaid'
            ]);

            // Restore stock
            foreach ($order->items as $item) {
                if ($item->product) {
                    $item->product->increment('stock', $item->quantity);
                }
            }

            return response()->json(['message' => 'Pesanan berhasil dibatalkan', 'order' => $order]);
        });
    }

    public function refreshPayment(Request $request, $id): JsonResponse
    {
        $order = Order::with('items.product')->where('user_id', $request->user()->id)->findOrFail($id);

        if ($order->payment_status === 'paid') {
            return response()->json(['message' => 'Pesanan sudah dibayar'], 400);
        }

        $newMidtransOrderId = $order->order_number . '-' . time();

        $itemDetails = [];
        foreach ($order->items as $item) {
            if ($item->product) {
                $itemDetails[] = [
                    'id'       => $item->product_id,
                    'price'    => (int) $item->price,
                    'quantity' => $item->quantity,
                    'name'     => substr($item->product->name, 0, 50),
                ];
            }
        }

        if ($order->shipping_cost > 0) {
            $itemDetails[] = [
                'id'       => 'SHIPPING',
                'price'    => (int) $order->shipping_cost,
                'quantity' => 1,
                'name'     => 'Ongkos Kirim (' . strtoupper($order->courier_company ?? 'Kurir') . ')',
            ];
        }

        $params = [
            'transaction_details' => [
                'order_id'     => $newMidtransOrderId,
                'gross_amount' => (int) $order->total_price,
            ],
            'item_details'     => $itemDetails,
            'customer_details' => [
                'first_name' => $order->recipient_name,
                'email'      => $request->user()->email,
                'phone'      => $order->recipient_phone,
            ],
        ];

        try {
            $snapToken = Snap::getSnapToken($params);

            if ($order->status === 'cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->decrement('stock', $item->quantity);
                    }
                }
            }

            $order->update([
                'midtrans_token'    => $snapToken,
                'midtrans_order_id' => $newMidtransOrderId,
                'status'            => 'pending',
                'payment_status'    => 'unpaid'
            ]);

            return response()->json([
                'message'    => 'Payment refreshed',
                'order'      => $order,
                'snap_token' => $snapToken
            ]);
        } catch (\Exception $e) {
            Log::error('Midtrans Snap error (refresh): ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memperbarui sesi pembayaran.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function syncPayment(Request $request, $id): JsonResponse
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);

        if (!$order->midtrans_order_id) {
            return response()->json(['message' => 'No Midtrans order ID found'], 400);
        }

        try {
            $statusResponse    = Transaction::status($order->midtrans_order_id);
            $transactionStatus = $statusResponse->transaction_status;
            $paymentType       = $statusResponse->payment_type ?? null;
            $fraudStatus       = $statusResponse->fraud_status ?? null;

            if ($transactionStatus === 'capture') {
                if ($fraudStatus === 'challenge') {
                    $order->update(['payment_status' => 'unpaid', 'status' => 'pending']);
                } elseif ($fraudStatus === 'accept') {
                    $order->update(['payment_status' => 'paid', 'status' => 'processing', 'payment_method' => $paymentType]);
                }
            } elseif ($transactionStatus === 'settlement') {
                $order->update(['payment_status' => 'paid', 'status' => 'processing', 'payment_method' => $paymentType]);
            } elseif (in_array($transactionStatus, ['cancel', 'deny', 'expire'])) {
                $order->update(['payment_status' => 'unpaid', 'status' => 'cancelled']);
            } elseif ($transactionStatus === 'pending') {
                $order->update(['payment_status' => 'unpaid', 'status' => 'pending']);
            }

            return response()->json(['message' => 'Status synchronized', 'order' => $order]);
        } catch (\Exception $e) {
            Log::error('Midtrans sync error: ' . $e->getMessage());
            return response()->json(['message' => 'Gagal sinkronisasi status.', 'error' => $e->getMessage()], 500);
        }
    }

    public function downloadInvoice(Request $request, $id)
    {
        $order = Order::with(['user', 'items.product'])->where('user_id', $request->user()->id)->findOrFail($id);

        if ($order->status === 'cancelled') {
            return response()->json(['message' => 'Pesanan dibatalkan, invoice tidak tersedia'], 400);
        }

        $pdf = Pdf::loadView('invoice', compact('order'));
        return $pdf->download('invoice-' . $order->order_number . '.pdf');
    }

    public function retryBiteship(Request $request, $id): JsonResponse
    {
        $order = Order::with('items.product')->findOrFail($id);

        if ($order->biteship_order_id && $order->biteship_waybill_id) {
            return response()->json(['message' => 'Order ini sudah memiliki resi pengiriman.'], 400);
        }

        if ($order->status !== 'shipped' && $order->status !== 'delivered') {
            return response()->json(['message' => 'Hanya order dengan status Dikirim yang bisa dibuatkan resi.'], 400);
        }

        if (!$order->destination_area_id || !$order->courier_company || !$order->courier_service) {
             return response()->json(['message' => 'Data kurir atau area pengiriman tidak lengkap.'], 400);
        }

        try {
            $itemsData = $order->items->map(fn($item) => [
                'product_id'   => $item->product_id,
                'product_name' => $item->product?->name ?? 'Produk',
                'price'        => (int) $item->price,
                'weight'       => $item->product?->weight ?? 500,
                'quantity'     => $item->quantity,
            ])->toArray();

            $biteshipResponse = $this->biteship->createOrder([
                'order_number'         => $order->order_number,
                'recipient_name'       => $order->recipient_name,
                'recipient_phone'      => $order->recipient_phone,
                'shipping_address'     => $order->shipping_address,
                'notes'                => $order->notes,
                'destination_area_id'  => $order->destination_area_id,
                'shipping_postal_code'  => $order->shipping_postal_code,
                'shipping_lat'         => $order->shipping_lat,
                'shipping_lng'         => $order->shipping_lng,
                'courier_company'      => $order->courier_company,
                'courier_service'      => $order->courier_service,
                'items'                => $itemsData,
            ]);

            $biteshipOrderId = $biteshipResponse['id'] ?? null;
            $waybillId = $biteshipResponse['courier']['waybill_id']
                ?? $biteshipResponse['courier']['tracking_id']
                ?? $biteshipResponse['waybill_id']
                ?? null;

            $order->update([
                'biteship_order_id' => $biteshipOrderId,
                'biteship_waybill_id' => $waybillId,
            ]);

            return response()->json([
                'message' => 'Resi berhasil dibuat ulang!',
                'order' => $order->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Gagal membuat resi: ' . $e->getMessage()
            ], 500);
        }
    }
}
