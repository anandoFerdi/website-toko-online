<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TrackingController extends Controller
{
    /**
     * Available couriers for tracking
     */
    public function couriers(): JsonResponse
    {
        $couriers = [
            ['code' => 'jne',      'name' => 'JNE'],
            ['code' => 'jnt',      'name' => 'J&T Express'],
            ['code' => 'sicepat',  'name' => 'SiCepat'],
            ['code' => 'anteraja', 'name' => 'AnterAja'],
            ['code' => 'idx',      'name' => 'ID Express'],
            ['code' => 'tiki',     'name' => 'TIKI'],
            ['code' => 'pos',      'name' => 'Pos Indonesia'],
            ['code' => 'ninja',    'name' => 'Ninja Express'],
            ['code' => 'sap',      'name' => 'SAP Express'],
            ['code' => 'lion',     'name' => 'Lion Parcel'],
            ['code' => 'jx',       'name' => 'J&T Cargo'],
            ['code' => 'rpx',      'name' => 'RPX'],
            ['code' => 'wahana',   'name' => 'Wahana'],
        ];

        return response()->json(['couriers' => $couriers]);
    }

    /**
     * Track a shipment for a specific order (authenticated user)
     */
    public function track(Request $request, $id): JsonResponse
    {
        $order = Order::where('user_id', $request->user()->id)->findOrFail($id);

        if (!$order->tracking_number || !$order->courier_code) {
            return response()->json([
                'message' => 'Nomor resi belum tersedia untuk pesanan ini.',
            ], 404);
        }

        return $this->fetchTracking($order->tracking_number, $order->courier_code);
    }

    /**
     * Public tracking — check any waybill without login
     */
    public function publicTrack(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'waybill_id'   => 'required|string|max:100',
            'courier_code' => 'required|string|max:50',
        ]);

        return $this->fetchTracking($validated['waybill_id'], $validated['courier_code']);
    }

    /**
     * Call Biteship Public Tracking API
     */
    private function fetchTracking(string $waybillId, string $courierCode): JsonResponse
    {
        $apiKey  = config('biteship.api_key');
        $baseUrl = config('biteship.base_url');

        if (empty($apiKey)) {
            return response()->json([
                'message' => 'Biteship API key belum dikonfigurasi.',
            ], 500);
        }

        $url = "{$baseUrl}/v1/trackings/{$waybillId}/couriers/{$courierCode}";

        try {
            $response = Http::withHeaders([
                'Authorization' => $apiKey,
                'Content-Type'  => 'application/json',
            ])->timeout(15)->get($url);

            if ($response->successful()) {
                return response()->json($response->json());
            }

            Log::warning('Biteship tracking API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
                'waybill' => $waybillId,
                'courier' => $courierCode,
            ]);

            // Return user-friendly error based on status code
            if ($response->status() === 404) {
                return response()->json([
                    'message' => 'Nomor resi tidak ditemukan. Pastikan nomor resi dan kurir sudah benar.',
                ], 404);
            }

            return response()->json([
                'message' => 'Gagal mengambil data tracking. Silakan coba lagi nanti.',
                'error'   => $response->json()['error'] ?? 'Unknown error',
            ], $response->status());
        } catch (\Exception $e) {
            Log::error('Biteship tracking exception: ' . $e->getMessage());

            return response()->json([
                'message' => 'Terjadi kesalahan saat menghubungi layanan tracking.',
            ], 500);
        }
    }
}
