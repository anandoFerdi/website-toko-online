<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Biteship order & waybill
            $table->string('biteship_order_id')->nullable()->after('midtrans_token');
            $table->string('biteship_waybill_id')->nullable()->after('biteship_order_id');

            // Courier details
            $table->string('courier_company')->nullable()->after('biteship_waybill_id');
            $table->string('courier_service')->nullable()->after('courier_company');
            $table->string('courier_service_name')->nullable()->after('courier_service');

            // Structured address fields
            $table->string('shipping_province')->nullable()->after('shipping_address');
            $table->string('shipping_city')->nullable()->after('shipping_province');
            $table->string('shipping_district')->nullable()->after('shipping_city');
            $table->string('shipping_village')->nullable()->after('shipping_district');
            $table->string('shipping_postal_code')->nullable()->after('shipping_village');

            // Coordinates from Leaflet map
            $table->decimal('shipping_lat', 10, 7)->nullable()->after('shipping_postal_code');
            $table->decimal('shipping_lng', 10, 7)->nullable()->after('shipping_lat');

            // Biteship area ID for destination
            $table->string('destination_area_id')->nullable()->after('shipping_lng');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'biteship_order_id',
                'biteship_waybill_id',
                'courier_company',
                'courier_service',
                'courier_service_name',
                'shipping_province',
                'shipping_city',
                'shipping_district',
                'shipping_village',
                'shipping_postal_code',
                'shipping_lat',
                'shipping_lng',
                'destination_area_id',
            ]);
        });
    }
};
