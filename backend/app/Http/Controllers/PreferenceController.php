<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function update(Request $request)
    {
        $validated = $request->validate([
            'language' => 'nullable|in:ar,en',
            'theme' => 'nullable|in:light,dark',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthenticated',
            ], 401);
        }

        $user->update([
            'preferred_language' => $validated['language'] ?? $user->preferred_language ?? 'ar',
            'preferred_theme' => $validated['theme'] ?? $user->preferred_theme ?? 'light',
        ]);

        return response()->json([
            'status' => 'success',
        ]);
    }
}
