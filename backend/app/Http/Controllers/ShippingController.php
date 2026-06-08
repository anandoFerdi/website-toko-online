<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Services\BiteshipService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShippingController extends Controller
{
    protected BiteshipService $biteship;

    public function __construct(BiteshipService $biteship)
    {
        $this->biteship = $biteship;
    }

    // ─────────────────────────────────────────────────────────────
    // Public: Search Areas (for address dropdown autocomplete)
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/shipping/areas?query=Jakarta+Selatan
     * Used by checkout to find the Biteship area_id for destination.
     */
    public function searchAreas(Request $request): JsonResponse
    {
        $query = trim($request->query('query', ''));

        if (strlen($query) < 3) {
            return response()->json(['areas' => [], 'message' => 'Minimal 3 karakter']);
        }

        $areas = $this->biteship->searchAreas($query);

        return response()->json(['areas' => $areas]);
    }

    // ─────────────────────────────────────────────────────────────
    // Public: Get Shipping Rates
    // ─────────────────────────────────────────────────────────────

    /**
     * POST /api/shipping/rates
     * Calculate shipping costs for all available couriers.
     */
    public function getRates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'destination_area_id' => 'required|string',
            'weight'              => 'required|integer|min:1',
            'subtotal'            => 'required|numeric|min:0',
        ]);

        // MOCK: Selalu kembalikan gratis ongkir tanpa memanggil Biteship Rates API
        $couriersList = explode(',', config('biteship.couriers', 'jne,jnt,sicepat,anteraja,ide,tiki,pos,ninja,lion,sap,wahana'));
        $pricing = [];

        foreach ($couriersList as $courierCode) {
            $code = trim(strtolower($courierCode));
            if (empty($code)) continue;

            $pricing[] = [
                'courier_name'         => strtoupper($code),
                'courier_code'         => $code,
                'courier_service_name' => 'Reguler',
                'courier_type'         => 'reg',
                'duration_range_min'   => 2,
                'duration_range_max'   => 4,
                'price'                => 0,
            ];
        }

        return response()->json([
            'pricing'                 => $pricing,
            'is_free_shipping'        => true,
            'free_shipping_threshold' => 0,
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // Public: Track Waybill
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/shipping/track?waybill_id=XXX&courier_code=jne
     * Public endpoint — no auth required.
     */
    public function track(Request $request): JsonResponse
    {
        $waybillId   = trim($request->query('waybill_id', ''));
        $courierCode = trim($request->query('courier_code', ''));

        if (empty($waybillId)) {
            return response()->json(['message' => 'Nomor resi (waybill_id) diperlukan'], 422);
        }

        $result = $this->biteship->trackWaybill($waybillId, $courierCode ?: null);

        if (empty($result)) {
            return response()->json([
                'message' => 'Data tracking tidak ditemukan. Pastikan nomor resi dan kurir benar.',
            ], 404);
        }

        return response()->json($result);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin: Search Areas (for admin to find origin area ID)
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/shipping/areas?query=...
     * Admin-only: also used to find the store's origin area ID.
     */
    public function adminSearchAreas(Request $request): JsonResponse
    {
        $query = trim($request->query('query', ''));

        if (strlen($query) < 3) {
            return response()->json(['areas' => []]);
        }

        $areas = $this->biteship->searchAreas($query);

        return response()->json([
            'areas'              => $areas,
            'current_origin_id'  => $this->biteship->getOriginAreaId(),
            'is_configured'      => $this->biteship->isConfigured(),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin: Download Shipping Label
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/orders/{id}/label
     * Proxy Biteship label HTML to frontend for printing.
     */
    public function downloadLabel(Request $request, $orderId): mixed
    {
        $order = Order::findOrFail($orderId);

        if (!$order->biteship_order_id) {
            return response()->json([
                'message' => 'Label belum tersedia. Resi dibuat otomatis saat status diubah ke "Dikirim".',
            ], 400);
        }

        $labelContent = $this->biteship->getLabel($order->biteship_order_id);

        if (!$labelContent) {
            return response()->json([
                'message' => 'Gagal mengambil label dari Biteship. Coba beberapa saat lagi.',
            ], 500);
        }

        return response($labelContent, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8');
    }

    // ─────────────────────────────────────────────────────────────
    // Admin: Track by Order ID (uses stored waybill)
    // ─────────────────────────────────────────────────────────────

    /**
     * GET /api/admin/orders/{id}/tracking
     * Fetch real-time tracking for a specific order.
     */
    public function trackOrder(Request $request, $orderId): JsonResponse
    {
        $order = Order::findOrFail($orderId);

        if (!$order->biteship_waybill_id) {
            return response()->json([
                'message' => 'Nomor resi belum tersedia untuk pesanan ini.',
            ], 400);
        }

        $result = $this->biteship->trackWaybill(
            $order->biteship_waybill_id,
            $order->courier_company
        );

        if (empty($result)) {
            return response()->json([
                'message' => 'Data tracking tidak ditemukan.',
            ], 404);
        }

        return response()->json($result);
    }
}
