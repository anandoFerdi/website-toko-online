<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Biteship API Configuration
    |--------------------------------------------------------------------------
    | API Key dari dashboard.biteship.com → Integrations → API Key
    | Format: biteship_test.xxx (sandbox) atau biteship_live.xxx (production)
    */
    'api_key'     => env('BITESHIP_API_KEY', ''),
    'api_url'     => env('BITESHIP_API_URL', 'https://api.biteship.com'),

    /*
    |--------------------------------------------------------------------------
    | Origin / Asal Toko
    |--------------------------------------------------------------------------
    | Dapatkan BITESHIP_ORIGIN_AREA_ID dengan memanggil:
    |   GET /api/admin/shipping/areas?query={nama_kota_kecamatan_kelurahan_anda}
    | Contoh: GET /api/admin/shipping/areas?query=Gambir Jakarta Pusat
    */
    'origin_area_id'       => env('BITESHIP_ORIGIN_AREA_ID', ''),
    'origin_contact_name'  => env('BITESHIP_ORIGIN_CONTACT_NAME', 'Gudang Komputer'),
    'origin_contact_phone' => env('BITESHIP_ORIGIN_CONTACT_PHONE', '081234567890'),
    'origin_address'       => env('BITESHIP_ORIGIN_ADDRESS', ''),
    'origin_lat'           => env('BITESHIP_ORIGIN_LAT', -6.2088),
    'origin_lng'           => env('BITESHIP_ORIGIN_LNG', 106.8456),

    /*
    |--------------------------------------------------------------------------
    | Free Shipping Threshold
    |--------------------------------------------------------------------------
    | Pembelian dengan subtotal >= threshold ini mendapat GRATIS ONGKIR
    */
    'free_shipping_threshold' => env('FREE_SHIPPING_THRESHOLD', 500000),

    /*
    |--------------------------------------------------------------------------
    | Default Couriers
    |--------------------------------------------------------------------------
    | Daftar kurir yang ditampilkan saat hitung ongkir
    */
    'couriers' => env('BITESHIP_COURIERS', 'jne,jnt,sicepat,anteraja,ide,tiki,pos,ninja,lion,sap,wahana'),
];
