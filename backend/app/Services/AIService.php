<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use App\Models\Product;
use App\Models\Category;

class AIService
{
    private string $apiKey;
    private string $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.key', '');
        $this->apiUrl = config('services.gemini.url', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent');
    }

    private function callGemini(string $prompt): string
    {
        if (empty($this->apiKey)) {
            return $this->getFallbackResponse($prompt);
        }

        try {
            $response = Http::timeout(30)->post($this->apiUrl . '?key=' . $this->apiKey, [
                'contents' => [
                    ['parts' => [['text' => $prompt]]]
                ],
                'generationConfig' => [
                    'temperature'     => 0.7,
                    'maxOutputTokens' => 8192,
                ],
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['candidates'][0]['content']['parts'][0]['text'] ?? 'Maaf, saya tidak dapat memberikan respons saat ini.';
            } else {
                \Log::error('Gemini API failed with status ' . $response->status() . ': ' . $response->body());
            }
        } catch (\Exception $e) {
            \Log::error('Gemini API exception: ' . $e->getMessage());
        }

        return $this->getFallbackResponse($prompt);
    }

    private function getFallbackResponse(string $prompt): string
    {
        return 'Maaf, layanan AI sementara tidak tersedia. Silakan tambahkan GEMINI_API_KEY di file .env untuk mengaktifkan fitur AI. Kunjungi https://aistudio.google.com/app/apikey untuk mendapatkan API key gratis.';
    }

    public function chat(string $message, string $contextType = 'general', ?int $contextId = null): string
    {
        $systemPrompt = $this->buildSystemPrompt($contextType, $contextId);
        $fullPrompt = $systemPrompt . "\n\nUser: " . $message . "\n\nAssistant:";
        return $this->callGemini($fullPrompt);
    }

    public function generatePCBuild(int $budget, string $useCase, string $cpuBrand, string $gpuBrand): array
    {
        $budgetFormatted = 'Rp ' . number_format($budget, 0, ',', '.');

        $products = Product::with(['category', 'brand'])
            ->where('is_active', true)
            ->where('price', '<=', $budget * 0.4)
            ->get();

        $productContext = $products->groupBy('category.name')->map(function ($items) {
            return $items->take(3)->map(fn($p) => "{$p->name} (Rp " . number_format($p->price, 0, ',', '.') . ", ID: {$p->id})")->join(', ');
        })->toArray();

        $productList = '';
        foreach ($productContext as $cat => $items) {
            $productList .= "\n{$cat}: {$items}";
        }

        $prompt = <<<PROMPT
Kamu adalah expert PC builder Indonesia. Buat rekomendasi rakitan PC berdasarkan:
- Budget: {$budgetFormatted}
- Kegunaan: {$useCase}
- Preferensi CPU: {$cpuBrand}
- Preferensi GPU: {$gpuBrand}

Produk tersedia di toko kami:{$productList}

Berikan rekomendasi dalam format JSON yang valid seperti ini:
{
  "build": [
    {"component": "CPU", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"},
    {"component": "GPU", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"},
    {"component": "Motherboard", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"},
    {"component": "RAM", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"},
    {"component": "SSD", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"},
    {"component": "PSU", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"},
    {"component": "Case", "name": "nama produk", "price": harga_angka, "reason": "alasan singkat"}
  ],
  "total_price": total_harga,
  "summary": "ringkasan build dalam 2-3 kalimat",
  "performance_estimate": "estimasi performa untuk kegunaan yang diminta",
  "compatibility_status": "compatible"
}

Pastikan total tidak melebihi budget. Jawab hanya JSON, tanpa teks lain.
PROMPT;

        $response = $this->callGemini($prompt);
        
        $start = strpos($response, '{');
        $end = strrpos($response, '}');
        
        if ($start !== false && $end !== false && $end > $start) {
            $jsonString = substr($response, $start, $end - $start + 1);
            $decoded = json_decode($jsonString, true);
            if ($decoded) {
                return $decoded;
            }
        }

        // Fallback build
        return $this->getFallbackBuild($budget, $useCase);
    }

    public function checkCompatibility(string $component1, string $component2): array
    {
        $prompt = <<<PROMPT
Kamu adalah expert teknisi komputer Indonesia. Cek kompatibilitas antara dua komponen PC berikut:
- Komponen 1: {$component1}
- Komponen 2: {$component2}

Berikan analisis dalam format JSON:
{
  "compatible": true/false,
  "status": "Compatible" atau "Not Compatible" atau "Conditional",
  "reason": "penjelasan teknis dalam bahasa Indonesia (2-3 kalimat)",
  "recommendations": ["saran 1 jika ada", "saran 2 jika ada"]
}

Jawab hanya JSON, tanpa teks lain.
PROMPT;

        $response = $this->callGemini($prompt);

        $start = strpos($response, '{');
        $end = strrpos($response, '}');
        
        if ($start !== false && $end !== false && $end > $start) {
            $jsonString = substr($response, $start, $end - $start + 1);
            $decoded = json_decode($jsonString, true);
            if ($decoded) {
                return $decoded;
            }
        }

        return [
            'compatible'      => null,
            'status'          => 'Unknown',
            'reason'          => 'Tidak dapat menganalisis kompatibilitas saat ini. Pastikan API key sudah dikonfigurasi.',
            'recommendations' => [],
        ];
    }

    private function buildSystemPrompt(string $contextType, ?int $contextId): string
    {
        $base = "Kamu adalah asisten AI toko komputer 'Gudang Komputer' yang ahli dalam komponen PC. Jawab dalam Bahasa Indonesia yang ramah dan teknikal. Berikan informasi yang akurat tentang komponen komputer, kompatibilitas, dan rekomendasi. PENTING: Selalu selesaikan jawaban kamu secara lengkap. Gunakan format yang rapi dengan poin-poin jika perlu. Jangan memotong jawaban di tengah kalimat.";

        if ($contextType === 'product' && $contextId) {
            $product = Product::with(['category', 'brand'])->find($contextId);
            if ($product) {
                $specs = json_encode($product->specs ?? [], JSON_PRETTY_PRINT);
                $base .= "\n\nKonteks produk saat ini:\nNama: {$product->name}\nKategori: {$product->category->name}\nBrand: {$product->brand->name}\nHarga: Rp " . number_format($product->price, 0, ',', '.') . "\nSpesifikasi: {$specs}";
            }
        }

        return $base;
    }

    private function getFallbackBuild(int $budget, string $useCase): array
    {
        return [
            'build' => [
                ['component' => 'CPU', 'name' => 'Rekomendasi CPU sesuai budget', 'price' => 0, 'reason' => 'Akan direkomendasikan setelah API key dikonfigurasi'],
                ['component' => 'GPU', 'name' => 'Rekomendasi GPU sesuai budget', 'price' => 0, 'reason' => 'Akan direkomendasikan setelah API key dikonfigurasi'],
                ['component' => 'Motherboard', 'name' => 'Rekomendasi Motherboard', 'price' => 0, 'reason' => ''],
                ['component' => 'RAM', 'name' => 'Rekomendasi RAM', 'price' => 0, 'reason' => ''],
                ['component' => 'SSD', 'name' => 'Rekomendasi SSD', 'price' => 0, 'reason' => ''],
                ['component' => 'PSU', 'name' => 'Rekomendasi PSU', 'price' => 0, 'reason' => ''],
                ['component' => 'Case', 'name' => 'Rekomendasi Case', 'price' => 0, 'reason' => ''],
            ],
            'total_price'          => 0,
            'summary'              => 'Tambahkan GEMINI_API_KEY di .env untuk mendapatkan rekomendasi AI.',
            'performance_estimate' => 'AI tidak tersedia',
            'compatibility_status' => 'unknown',
        ];
    }
}
