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
                'stock' => 46,
                'image' => '/storage/products/HJA4kQ0MMCtEzbZDKPZ0ZJKLm20ha0Bktewkn8G0.jpg', // Path relatif tanpa /storage/
                'rating' => 4.8,
                'is_trending' => true,
                'specs' => json_encode(['cores' => '10', 'threads' => '16', 'base_clock' => '2.5GHz']),
                'compatibility' => json_encode(['socket' => 'LGA1700']),
            ],
            [
                'category_id' => $cpuId,
                'brand_id' => $amdId,
                'name' => 'AMD Ryzen 5 7600X',
                'description' => 'Processor AMD Zen 4 untuk performa gaming dan produktivitas.',
                'price' => 3800000,
                'stock' => 37,
                'image' => '/storage/products/qTEFdBiGlLJfFrXDKwlx0VdB5GUJEu74swIU5eaR.jpg',
                'rating' => 4.7,
                'is_trending' => true,
                'specs' => json_encode(['cores' => '6', 'threads' => '12', 'base_clock' => '4.7GHz']),
                'compatibility' => json_encode(['socket' => 'AM5']),
            ],
            [
                'category_id' => $gpuId,
                'brand_id' => $nvidiaId,
                'name' => 'NVIDIA GeForce RTX 4060 Ti 8GB',
                'description' => 'Kartu grafis gaming 1080p dan 1440p terbaik dari NVIDIA.',
                'price' => 6500000,
                'stock' => 16,
                'image' => '/storage/products/g5pvNj9kPgrloo1FRYWbh9mZcbF4vPlmjKzgXCLQ.jpg',
                'rating' => 4.9,
                'is_trending' => true,
                'specs' => json_encode(['vram' => '8GB GDDR6', 'cuda_cores' => '4352']),
                'compatibility' => json_encode(['pcie' => 'PCIe 4.0 x8', 'psu_recommended' => '550W']),
            ],
            [
                'category_id' => $moboId,
                'brand_id' => $asusId,
                'name' => 'ASUS ROG STRIX B760-A GAMING WIFI',
                'description' => 'Motherboard LGA1700 dengan fitur premium.',
                'price' => 3500000,
                'stock' => 27,
                'image' => '/storage/products/aNF3LkDgiscPl4eCVneSZFH1cgbTgNpJLo4spV2A.jpg',
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
                'stock' => 59,
                'image' => '/storage/products/eUqW2Mrf1mX6QNTsCPzpSNbwcsxVqfte75VaD4uJ.jpg',
                'rating' => 4.8,
                'is_trending' => false,
                'specs' => json_encode(['capacity' => '32GB', 'speed' => '6000MHz', 'type' => 'DDR5']),
                'compatibility' => json_encode(['type' => 'DDR5']),
            ],
            [
                'category_id' => $cpuId,
                'brand_id' => $amdId,
                'name' => 'AMD Ryzen 7 5700X',
                'description' => 'Prosesor AMD Ryzen 7 5700X adalah CPU desktop bersoket AM4 yang tangguh. Diluncurkan dengan arsitektur Zen 3, menjadikannya pilihan populer untuk gaming kelas menengah dan produktivitas.',
                'price' => 4099998,
                'stock' => 38,
                'image' => '/storage/products/afgcz62rQIU43t6ak1ry2MFLhQYPpQxfW6f26WDY.jpg',
                'rating' => 0.0,
                'is_trending' => true,
                'specs' => json_encode([
                    "name" => "AMD Ryzen™ 7 5700X",
                    "family" => "Ryzen",
                    "series" => "Ryzen 5000 Series",
                    "form_factor" => "Desktops, Boxed Processor",
                    "market_segment" => "Enthusiast Desktop",
                    "former_codename" => "Vermeer",
                    "processor_architecture" => "Zen 3",
                    "cpu_cores" => "8",
                    "of_threads" => "16",
                    "max_boost_clock" => "Up to 4.6 GHz",
                    "base_clock" => "3.4 GHz",
                    "l1_cache" => "512 KB",
                    "l2_cache" => "4 MB",
                    "l3_cache" => "32 MB",
                    "processor_technology" => "TSMC 7nm FinFET",
                    "unlocked_for_overclocking" => "true",
                    "launch_date" => "2022-04-04"
                ]),
                'compatibility' => json_encode([
                    "cpu_socket" => "AM4",
                    "supporting_chipsets" => "X570, X470, X370, B550, B450, B350, A520",
                    "default_tdp" => "65W",
                    "thermal_solution" => "Not Included (Cooler required)",
                    "max_operating_temperature" => "90°C",
                    "os_support" => "Windows 11/10 64-Bit, RHEL, Ubuntu"
                ]),
            ],
            [
                'category_id' => $cpuId,
                'brand_id' => $amdId,
                'name' => 'AMD Ryzen™ 9 5900X Desktop Processor',
                'description' => 'Prosesor ini sangat ideal untuk kebutuhan produktivitas berat (seperti rendering 3D dan editing video), serta memberikan performa gaming papan atas.',
                'price' => 7600000,
                'stock' => 42,
                'image' => '/storage/products/chLy3uzb2mwLoIZiqagVEXTwGCZLh6zWjBOJ2doB.png',
                'rating' => 0.0,
                'is_trending' => true,
                'specs' => json_encode([
                    "name" => "AMD Ryzen™ 9 5900X",
                    "family" => "Ryzen",
                    "series" => "Ryzen 5000 Series",
                    "form_factor" => "Desktops, Boxed Processor",
                    "former_codename" => "Vermeer",
                    "cpu_cores" => "12",
                    "of_threads" => "24",
                    "max_boost_clock" => "Up to 4.8 GHz",
                    "base_clock" => "3.7 GHz",
                    "l2_cache" => "6 MB",
                    "l3_cache" => "64 MB",
                    "default_tdp" => "105W",
                    "processor_technology_for_cpu_cores" => "TSMC 7nm FinFET",
                    "unlocked_for_overclocking" => "true",
                    "cpu_socket" => "AM4",
                    "thermal_solution_pib" => "Not Included",
                    "recommended_cooler" => "Liquid cooler recommended for optimal performance",
                    "max_operating_temperature_tjmax" => "90°C",
                    "launch_date" => "2020-11-05",
                    "os_support" => "Windows 10 - 64-Bit Edition,RHEL x86 64-Bit,Ubuntu x86 64-Bit"
                ]),
                'compatibility' => json_encode([
                    "cpu_socket" => "AM4",
                    "chipset_support" => "A520, B450, B550, X470, X570",
                    "default_tdp" => "105W",
                    "recommended_cooler" => "Liquid cooler recommended (AIO 240mm/360mm)",
                    "memory_type_support" => "DDR4 (Up to 3200 MHz)",
                    "pcie_version" => "PCIe 4.0",
                    "os_support" => "Windows 10/11 64-Bit, Linux"
                ]),
            ]
        ];

        foreach ($products as $p) {
            $p['slug'] = Str::slug($p['name']) . '-' . Str::random(5);
            Product::create($p);
        }
    }
}
