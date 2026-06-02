<?php

namespace App\Http\Controllers;

use App\Models\AIChat;
use App\Services\AIService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class AIController extends Controller
{
    public function __construct(private AIService $aiService) {}

    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message'      => 'required|string|max:1000',
            'session_id'   => 'nullable|string',
            'context_type' => 'nullable|string|in:product,builder,compatibility,general',
            'context_id'   => 'nullable|integer',
        ]);

        $sessionId   = $validated['session_id'] ?? Str::uuid()->toString();
        $contextType = $validated['context_type'] ?? 'general';
        $contextId   = $validated['context_id'] ?? null;
        $userId      = $request->user()?->id;

        // Save user message
        AIChat::create([
            'user_id'      => $userId,
            'session_id'   => $sessionId,
            'role'         => 'user',
            'message'      => $validated['message'],
            'context_type' => $contextType,
            'context_id'   => $contextId,
        ]);

        // Get AI response
        $response = $this->aiService->chat($validated['message'], $contextType, $contextId);

        // Save AI response
        AIChat::create([
            'user_id'      => $userId,
            'session_id'   => $sessionId,
            'role'         => 'assistant',
            'message'      => $response,
            'context_type' => $contextType,
            'context_id'   => $contextId,
        ]);

        return response()->json([
            'session_id' => $sessionId,
            'message'    => $response,
        ]);
    }

    public function generateBuild(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'budget'    => 'required|integer|min:1000000',
            'use_case'  => 'required|string|in:Gaming,Editing,Streaming,Coding,Office',
            'cpu_brand' => 'required|string|in:Intel,AMD,Any',
            'gpu_brand' => 'required|string|in:NVIDIA,Radeon,Any',
        ]);

        $build = $this->aiService->generatePCBuild(
            $validated['budget'],
            $validated['use_case'],
            $validated['cpu_brand'],
            $validated['gpu_brand']
        );

        // Save to chat history
        AIChat::create([
            'user_id'      => $request->user()?->id,
            'session_id'   => Str::uuid()->toString(),
            'role'         => 'assistant',
            'message'      => json_encode($build),
            'context_type' => 'builder',
        ]);

        return response()->json($build);
    }

    public function checkCompatibility(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'component1' => 'required|string|max:500',
            'component2' => 'required|string|max:500',
        ]);

        $result = $this->aiService->checkCompatibility(
            $validated['component1'],
            $validated['component2']
        );

        return response()->json($result);
    }

    public function chatHistory(Request $request): JsonResponse
    {
        $chats = AIChat::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json($chats);
    }

    public function sessionHistory(Request $request, string $sessionId): JsonResponse
    {
        $chats = AIChat::where('session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json($chats);
    }
}
