<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Admin & Test User
        User::create([
            'name' => 'Admin Gudang Komputer',
            'email' => 'admin@gudangkomputer.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        User::create([
            'name' => 'Test User',
            'email' => 'user@gudangkomputer.com',
            'password' => Hash::make('password'),
            'role' => 'user',
        ]);

        // 2. Categories
        $categories = [
            ['name' => 'CPU', 'slug' => 'cpu'],
            ['name' => 'Motherboard', 'slug' => 'motherboard'],
            ['name' => 'GPU', 'slug' => 'gpu'],
            ['name' => 'RAM', 'slug' => 'ram'],
            ['name' => 'Storage (SSD/HDD)', 'slug' => 'storage'],
            ['name' => 'Power Supply', 'slug' => 'psu'],
            ['name' => 'Casing', 'slug' => 'case'],
            ['name' => 'Cooler', 'slug' => 'cooler'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // 3. Brands
        $brands = [
            ['name' => 'Intel', 'slug' => 'intel'],
            ['name' => 'AMD', 'slug' => 'amd'],
            ['name' => 'NVIDIA', 'slug' => 'nvidia'],
            ['name' => 'ASUS', 'slug' => 'asus'],
            ['name' => 'MSI', 'slug' => 'msi'],
            ['name' => 'Gigabyte', 'slug' => 'gigabyte'],
            ['name' => 'Corsair', 'slug' => 'corsair'],
            ['name' => 'Kingston', 'slug' => 'kingston'],
            ['name' => 'Samsung', 'slug' => 'samsung'],
            ['name' => 'NZXT', 'slug' => 'nzxt'],
            ['name' => 'Be Quiet!', 'slug' => 'be-quiet'],
        ];

        foreach ($brands as $brand) {
            Brand::create($brand);
        }

        // 4. Products (Seed a few sample products)
        $this->seedProducts();
    }

    private function seedProducts()
    {
        $cpuId = Category::where('slug', 'cpu')->first()->id;
        $gpuId = Category::where('slug', 'gpu')->first()->id;
        $moboId = Category::where('slug', 'motherboard')->first()->id;
        $ramId = Category::where('slug', 'ram')->first()->id;

        $intelId = Brand::where('slug', 'intel')->first()->id;
        $amdId = Brand::where('slug', 'amd')->first()->id;
        $nvidiaId = Brand::where('slug', 'nvidia')->first()->id;
        $asusId = Brand::where('slug', 'asus')->first()->id;
        $corsairId = Brand::where('slug', 'corsair')->first()->id;

        $products = [
            [
                'category_id' => $cpuId,
                'brand_id' => $intelId,
                'name' => 'Intel Core i5-13400F',
                'description' => 'Processor Intel Generasi ke-13 yang menawarkan performa gaming luar biasa.',
                'price' => 3200000,
                'stock' => 50,
                'image' => 'https://via.placeholder.com/400?text=Intel+i5',
                'rating' => 4.8,
                'is_trending' => true,
                'specs' => json_encode(['cores' => 10, 'threads' => 16, 'base_clock' => '2.5GHz']),
                'compatibility' => json_encode(['socket' => 'LGA1700']),
            ],
            [
                'category_id' => $cpuId,
                'brand_id' => $amdId,
                'name' => 'AMD Ryzen 5 7600X',
                'description' => 'Processor AMD Zen 4 untuk performa gaming dan produktivitas.',
                'price' => 3800000,
                'stock' => 40,
                'image' => 'https://via.placeholder.com/400?text=AMD+Ryzen+5',
                'rating' => 4.7,
                'is_trending' => true,
                'specs' => json_encode(['cores' => 6, 'threads' => 12, 'base_clock' => '4.7GHz']),
                'compatibility' => json_encode(['socket' => 'AM5']),
            ],
            [
                'category_id' => $gpuId,
                'brand_id' => $nvidiaId, // Should technically be ASUS/MSI etc with NVIDIA chipset, keeping simple for seed
                'name' => 'NVIDIA GeForce RTX 4060 Ti 8GB',
                'description' => 'Kartu grafis gaming 1080p dan 1440p terbaik dari NVIDIA.',
                'price' => 6500000,
                'stock' => 20,
                'image' => 'https://via.placeholder.com/400?text=RTX+4060+Ti',
                'rating' => 4.9,
                'is_trending' => true,
                'specs' => json_encode(['vram' => '8GB GDDR6', 'cuda_cores' => 4352]),
                'compatibility' => json_encode(['pcie' => 'PCIe 4.0 x8', 'psu_recommended' => '550W']),
            ],
            [
                'category_id' => $moboId,
                'brand_id' => $asusId,
                'name' => 'ASUS ROG STRIX B760-A GAMING WIFI',
                'description' => 'Motherboard LGA1700 dengan fitur premium.',
                'price' => 3500000,
                'stock' => 30,
                'image' => 'https://via.placeholder.com/400?text=ASUS+B760-A',
                'rating' => 4.6,
                'is_trending' => false,
                'specs' => json_encode(['form_factor' => 'ATX', 'memory_type' => 'DDR5']),
                'compatibility' => json_encode(['socket' => 'LGA1700', 'ram' => 'DDR5']),
            ],
            [
                'category_id' => $ramId,
                'brand_id' => $corsairId,
                'name' => 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz',
                'description' => 'RAM DDR5 berkecepatan tinggi dengan RGB.',
                'price' => 2100000,
                'stock' => 60,
                'image' => 'https://via.placeholder.com/400?text=Corsair+32GB+DDR5',
                'rating' => 4.8,
                'is_trending' => true,
                'specs' => json_encode(['capacity' => '32GB', 'speed' => '6000MHz', 'type' => 'DDR5']),
                'compatibility' => json_encode(['type' => 'DDR5']),
            ]
        ];

        foreach ($products as $p) {
            $p['slug'] = Str::slug($p['name']) . '-' . Str::random(5);
            Product::create($p);
        }
    }
}
