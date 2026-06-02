<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private function verifyCaptcha(?string $token): bool
    {
        $secret = config('services.recaptcha.secret');
        // If no secret configured, skip verification (dev mode)
        if (empty($secret)) return true;
        // If no token provided, fail
        if (empty($token)) return false;

        $response = Http::asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
            'secret'   => $secret,
            'response' => $token,
        ]);

        return $response->json('success', false);
    }

    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone'    => 'nullable|string|max:20',
        ]);

        if (!$this->verifyCaptcha($request->input('captcha_token'))) {
            return response()->json(['message' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.'], 422);
        }

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone'    => $validated['phone'] ?? null,
            'role'     => 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        if (!$this->verifyCaptcha($request->input('captcha_token'))) {
            return response()->json(['message' => 'Verifikasi CAPTCHA gagal. Silakan coba lagi.'], 422);
        }

        if (!Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']])) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user  = User::where('email', $validated['email'])->first();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'phone'   => 'nullable|string|max:20',
            'address' => 'nullable|string|max:1000',
        ]);
        $request->user()->update($validated);
        return response()->json(['message' => 'Profil berhasil diperbarui', 'user' => $request->user()]);
    }

    public function changeEmail(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email'    => 'required|email|unique:users,email,' . $request->user()->id,
            'password' => 'required|string',
        ]);

        if (!Hash::check($validated['password'], $request->user()->password)) {
            return response()->json(['message' => 'Kata sandi tidak sesuai'], 422);
        }

        $request->user()->update(['email' => $validated['email']]);
        return response()->json(['message' => 'Email berhasil diperbarui', 'user' => $request->user()]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password'      => 'required|string',
            'password'              => 'required|string|min:8|confirmed',
        ]);

        if (!Hash::check($validated['current_password'], $request->user()->password)) {
            return response()->json(['message' => 'Kata sandi saat ini tidak sesuai'], 422);
        }

        $request->user()->update(['password' => Hash::make($validated['password'])]);
        return response()->json(['message' => 'Kata sandi berhasil diperbarui']);
    }

    public function deleteAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'password' => 'required|string',
        ]);

        if (!Hash::check($validated['password'], $request->user()->password)) {
            return response()->json(['message' => 'Kata sandi tidak sesuai'], 422);
        }

        $user = $request->user();
        $request->user()->currentAccessToken()->delete();
        $user->delete();

        return response()->json(['message' => 'Akun berhasil dihapus']);
    }
}
