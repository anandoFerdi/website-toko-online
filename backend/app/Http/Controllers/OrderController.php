<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
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
    public function __construct()
    {
        Config::$serverKey    = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');
        Config::$isSanitized  = true;
        Config::$is3ds        = true;
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
            'shipping_address' => 'required|string',
            'recipient_name'   => 'required|string|max:255',
            'recipient_phone'  => 'required|string|max:20',
            'notes'            => 'nullable|string',
        ]);

        $cartItems = Cart::with('product')
            ->where('user_id', $request->user()->id)
            ->get();

        if ($cartItems->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 422);
        }

        return DB::transaction(function () use ($request, $validated, $cartItems) {
            $subtotal    = $cartItems->sum(fn($item) => $item->quantity * $item->product->price);
            $shippingCost = 0;
            $total        = $subtotal + $shippingCost;
            $user         = $request->user();
            $orderNumber  = 'GK-' . strtoupper(Str::random(10));

            $order = Order::create([
                'user_id'          => $user->id,
                'order_number'     => $orderNumber,
                'subtotal'         => $subtotal,
                'shipping_cost'    => $shippingCost,
                'total_price'      => $total,
                'status'           => 'pending',
                'payment_status'   => 'unpaid',
                'payment_method'   => 'midtrans',
                'shipping_address' => $validated['shipping_address'],
                'recipient_name'   => $validated['recipient_name'],
                'recipient_phone'  => $validated['recipient_phone'],
                'notes'            => $validated['notes'] ?? null,
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
                'item_details' => $itemDetails,
                'customer_details' => [
                    'first_name' => $validated['recipient_name'],
                    'email'      => $user->email,
                    'phone'      => $validated['recipient_phone'],
                ],
            ];

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

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $order = Order::findOrFail($id);
        $validated = $request->validate([
            'status'          => 'sometimes|in:pending,processing,shipped,delivered,cancelled',
            'payment_status'  => 'sometimes|in:unpaid,paid,refunded',
            'tracking_number' => 'nullable|string|max:100',
            'courier_code'    => 'nullable|string|max:50',
            'courier_name'    => 'nullable|string|max:100',
        ]);

        // If shipping with tracking info, ensure both tracking_number and courier_code are provided
        if (($validated['status'] ?? $order->status) === 'shipped') {
            $trackingNumber = $validated['tracking_number'] ?? $order->tracking_number;
            $courierCode = $validated['courier_code'] ?? $order->courier_code;

            if (empty($trackingNumber) || empty($courierCode)) {
                return response()->json([
                    'message' => 'Nomor resi dan kurir wajib diisi saat status diubah ke "Dikirim".'
                ], 422);
            }
        }

        $order->update($validated);
        return response()->json($order);
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
                'status' => 'cancelled',
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

        // To generate a new token, Midtrans requires a unique order_id per transaction attempt.
        // We append a timestamp to the original order_number.
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

        $params = [
            'transaction_details' => [
                'order_id'     => $newMidtransOrderId,
                'gross_amount' => (int) $order->total_price,
            ],
            'item_details' => $itemDetails,
            'customer_details' => [
                'first_name' => $order->recipient_name,
                'email'      => $request->user()->email,
                'phone'      => $order->recipient_phone,
            ],
        ];

        try {
            $snapToken = Snap::getSnapToken($params);
            
            // If the order was cancelled, we restore it to pending and reduce stock again
            if ($order->status === 'cancelled') {
                foreach ($order->items as $item) {
                    if ($item->product) {
                        $item->product->decrement('stock', $item->quantity);
                    }
                }
            }

            $order->update([
                'midtrans_token' => $snapToken, 
                'midtrans_order_id' => $newMidtransOrderId,
                'status' => 'pending',
                'payment_status' => 'unpaid'
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
            $statusResponse = Transaction::status($order->midtrans_order_id);
            $transactionStatus = $statusResponse->transaction_status;
            $paymentType = $statusResponse->payment_type ?? null;
            $fraudStatus = $statusResponse->fraud_status ?? null;

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
}
