<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Order;
use Midtrans\Transaction;
use Midtrans\Config;
use Illuminate\Support\Facades\Log;

class CheckExpiredOrders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:check-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check pending orders against Midtrans and cancel if expired';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Config::$serverKey = config('midtrans.server_key');
        Config::$isProduction = config('midtrans.is_production');

        // Look for orders that are pending and older than 1 hour (plus a small buffer)
        $orders = Order::with('items.product')
            ->where('status', 'pending')
            ->where('payment_status', 'unpaid')
            ->whereNotNull('midtrans_order_id')
            ->where('updated_at', '<', now()->subMinutes(60))
            ->get();

        $this->info("Found {$orders->count()} pending orders to check.");

        foreach ($orders as $order) {
            try {
                $statusResponse = Transaction::status($order->midtrans_order_id);
                
                // If it expired on Midtrans side, cancel it locally
                if (in_array($statusResponse->transaction_status, ['cancel', 'deny', 'expire'])) {
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

                    $this->info("Order {$order->order_number} cancelled (expired).");
                } elseif ($statusResponse->transaction_status === 'settlement' || $statusResponse->transaction_status === 'capture') {
                    // Just in case it was actually paid but webhook failed
                    $order->update([
                        'status' => 'processing',
                        'payment_status' => 'paid',
                        'payment_method' => $statusResponse->payment_type ?? 'midtrans'
                    ]);
                    $this->info("Order {$order->order_number} marked as paid.");
                }
            } catch (\Exception $e) {
                // If 404 from midtrans, it means it expired and was purged, or never created properly
                if (str_contains($e->getMessage(), '404')) {
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
                    $this->info("Order {$order->order_number} cancelled (not found in Midtrans).");
                } else {
                    Log::error("Failed checking order {$order->order_number}: " . $e->getMessage());
                    $this->error("Failed checking order {$order->order_number}: " . $e->getMessage());
                }
            }
        }
    }
}
