<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BiteshipService
{
    protected string $apiKey;
    protected string $apiUrl;
    protected string $originAreaId;
    protected string $originContactName;
    protected string $originContactPhone;
    protected string $originAddress;
    protected float  $originLat;
    protected float  $originLng;

    public function __construct()
    {
        $this->apiKey             = config('biteship.api_key', '');
        $this->apiUrl             = rtrim(config('biteship.api_url', 'https://api.biteship.com'), '/');
        $this->originAreaId       = config('biteship.origin_area_id', '');
        $this->originContactName  = config('biteship.origin_contact_name', 'Gudang Komputer');
        $this->originContactPhone = config('biteship.origin_contact_phone', '081234567890');
        $this->originAddress      = config('biteship.origin_address', '');
        $this->originLat          = (float) config('biteship.origin_lat', -6.2088);
        $this->originLng          = (float) config('biteship.origin_lng', 106.8456);
    }

    // ─────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────

    protected function headers(): array
    {
        return [
            'Authorization' => $this->apiKey,
            'Content-Type'  => 'application/json',
        ];
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->originAreaId);
    }

    public function getOriginAreaId(): string   { return $this->originAreaId; }
    public function getOriginAddress(): string  { return $this->originAddress; }
    public function getOriginLat(): float       { return $this->originLat; }
    public function getOriginLng(): float       { return $this->originLng; }

    // ─────────────────────────────────────────────────────────────
    // Areas Search  (autocomplete for destination)
    // ─────────────────────────────────────────────────────────────

    /**
     * Search Biteship areas for dropdown autocomplete.
     * Returns array of area objects with area_id, name, administrative_division_level fields.
     */
    public function searchAreas(string $query): array
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(10)
                ->get("{$this->apiUrl}/v1/maps/areas", [
                    'countries' => 'ID',
                    'input'     => $query,
                    'type'      => 'single',
                ]);

            if ($response->successful()) {
                return $response->json('areas', []);
            }

            Log::warning('Biteship searchAreas non-200: ' . $response->status() . ' ' . $response->body());
            return [];
        } catch (\Throwable $e) {
            Log::error('Biteship searchAreas exception: ' . $e->getMessage());
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Rates
    // ─────────────────────────────────────────────────────────────

    /**
     * Get shipping rates from origin to destination.
     *
     * @param  string  $destinationAreaId  Biteship area_id for destination
     * @param  int     $totalWeight        Total weight in grams
     * @param  array   $items              [['name', 'value', 'quantity']] for insurance/value
     * @return array   List of pricing options from Biteship
     */
    public function getRates(string $destinationAreaId, int $totalWeight, array $items = []): array
    {
        if (!$this->isConfigured()) {
            Log::warning('Biteship not configured: missing API key or origin area ID');
            return [];
        }

        $totalValue = array_sum(array_map(fn($i) => ($i['value'] ?? 0) * ($i['quantity'] ?? 1), $items));

        $payload = [
            'origin_area_id'      => $this->originAreaId,
            'destination_area_id' => $destinationAreaId,
            'couriers'            => config('biteship.couriers', 'jne,jnt,sicepat,anteraja,ide,tiki,pos,ninja,lion,sap'),
            'items'               => [
                [
                    'name'        => 'Paket Belanja Gudang Komputer',
                    'description' => 'Paket elektronik & komputer',
                    'value'       => max((int) $totalValue, 1000),
                    'length'      => 30,
                    'width'       => 30,
                    'height'      => 20,
                    'weight'      => max($totalWeight, 1),
                    'quantity'    => 1,
                ],
            ],
        ];

        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(15)
                ->post("{$this->apiUrl}/v1/rates/couriers", $payload);

            if ($response->successful()) {
                return $response->json('pricing', []);
            }

            Log::warning('Biteship getRates non-200: ' . $response->status() . ' ' . $response->body());
            return [];
        } catch (\Throwable $e) {
            Log::error('Biteship getRates exception: ' . $e->getMessage());
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Create Shipment Order
    // ─────────────────────────────────────────────────────────────

    /**
     * Create a shipment order on Biteship.
     * Called automatically when admin changes order status to 'shipped'.
     *
     * @param  array  $data  Order data from our database
     * @return array  Biteship order response (id, waybill_id, status, etc.)
     * @throws \Exception on failure
     */
    public function createOrder(array $data): array
    {
        $payload = [
            'shipper_contact_name'     => $this->originContactName,
            'shipper_contact_phone'    => $this->originContactPhone,
            'shipper_contact_email'    => config('mail.from.address', 'noreply@gudangkomputer.com'),
            'shipper_organization'     => 'Gudang Komputer',

            'origin_contact_name'      => $this->originContactName,
            'origin_contact_phone'     => $this->originContactPhone,
            'origin_address'           => $this->originAddress ?: 'Gudang Komputer',
            'origin_note'              => '',
            'origin_area_id'           => $this->originAreaId,

            'destination_contact_name'  => $data['recipient_name'],
            'destination_contact_phone' => $data['recipient_phone'],
            'destination_address'       => $data['shipping_address'],
            'destination_note'          => $data['notes'] ?? '',
            'destination_area_id'       => $data['destination_area_id'],
            'destination_postal_code'   => $data['shipping_postal_code'] ?? '',

            'courier_company'  => strtolower($data['courier_company']),
            'courier_type'     => (strtolower($data['courier_company']) === 'jnt' && strtolower($data['courier_service']) === 'reg') ? 'ez' : strtolower($data['courier_service']),
            'delivery_type'    => 'now',
            'order_note'       => $data['notes'] ?? '',

            'metadata' => [
                'our_order_number' => $data['order_number'],
            ],

            'items' => array_map(fn($item) => [
                'id'          => (string) $item['product_id'],
                'name'        => substr($item['product_name'] ?? 'Produk', 0, 50),
                'description' => substr($item['product_name'] ?? 'Produk', 0, 100),
                'value'       => (int) $item['price'],
                'weight'      => max((int) ($item['weight'] ?? 500), 1),
                'length'      => 20,
                'width'       => 20,
                'height'      => 20,
                'quantity'    => (int) $item['quantity'],
            ], $data['items']),
        ];

        // Add coordinates if available
        if (!empty($data['shipping_lat']) && !empty($data['shipping_lng'])) {
            $payload['destination_coordinate'] = [
                'latitude'  => (float) $data['shipping_lat'],
                'longitude' => (float) $data['shipping_lng'],
            ];
        }

        $response = Http::withHeaders($this->headers())
            ->timeout(30)
            ->post("{$this->apiUrl}/v1/orders", $payload);

        if ($response->successful()) {
            return $response->json();
        }

        $errorBody = $response->body();
        Log::error('Biteship createOrder failed: ' . $response->status() . ' ' . $errorBody);
        throw new \Exception('Gagal membuat order Biteship: ' . ($response->json('error') ?? $errorBody));
    }

    // ─────────────────────────────────────────────────────────────
    // Tracking
    // ─────────────────────────────────────────────────────────────

    /**
     * Track a shipment by waybill ID.
     *
     * @param  string       $waybillId    Nomor resi
     * @param  string|null  $courierCode  Kode kurir (jne, jnt, sicepat, dll)
     * @return array        Tracking data with history events
     */
    public function trackWaybill(string $waybillId, ?string $courierCode = null): array
    {
        try {
            $params = ['waybill_id' => $waybillId];
            if ($courierCode) {
                $params['courier_code'] = strtolower($courierCode);
            }

            $response = Http::withHeaders($this->headers())
                ->timeout(15)
                ->get("{$this->apiUrl}/v1/trackings", $params);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning('Biteship trackWaybill non-200: ' . $response->status() . ' ' . $response->body());
            return [];
        } catch (\Throwable $e) {
            Log::error('Biteship trackWaybill exception: ' . $e->getMessage());
            return [];
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Label
    // ─────────────────────────────────────────────────────────────

    /**
     * Get shipping label content (HTML) from Biteship.
     *
     * @param  string  $biteshipOrderId  The ID returned from createOrder()
     * @return string|null               HTML content of the label
     */
    public function getLabel(string $biteshipOrderId): ?string
    {
        try {
            $response = Http::withHeaders($this->headers())
                ->timeout(15)
                ->get("{$this->apiUrl}/v1/orders/{$biteshipOrderId}/label");

            if ($response->successful()) {
                // Biteship returns HTML label
                $body = $response->body();
                if (!empty($body)) {
                    return $body;
                }
                // If JSON with html field
                return $response->json('html');
            }

            Log::warning('Biteship getLabel non-200: ' . $response->status() . ' ' . $response->body());
            return null;
        } catch (\Throwable $e) {
            Log::error('Biteship getLabel exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Get the public Biteship label URL (if API provides it).
     */
    public function getLabelUrl(string $biteshipOrderId): ?string
    {
        // Some Biteship integrations return a direct URL; we build it as a proxy fallback
        return null;
    }
}
