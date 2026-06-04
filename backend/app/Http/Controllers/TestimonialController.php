<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Testimonial;

class TestimonialController extends Controller
{
    public function index()
    {
        // Get approved testimonials, limit to 10 latest
        $testimonials = Testimonial::where('is_approved', true)
            ->latest()
            ->take(10)
            ->get();
        
        return response()->json($testimonials);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'role' => 'nullable|string|max:255',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string',
        ]);

        $testimonial = Testimonial::create($validated);

        return response()->json([
            'message' => 'Ulasan berhasil dikirim',
            'testimonial' => $testimonial
        ], 201);
    }
}
