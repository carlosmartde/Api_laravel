<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AutenticacionController extends Controller
{
    /**
     * Valida las credenciales del usuario y emite un token personal de Passport.
     */
    public function login(Request $request): JsonResponse
    {
        $credenciales = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'nombre_token' => ['sometimes', 'string', 'max:100'],
        ]);

        $usuario = User::query()->where('email', $credenciales['email'])->first();

        if (! $usuario || ! Hash::check($credenciales['password'], $usuario->password)) {
            return response()->json([
                'mensaje' => 'Las credenciales proporcionadas no son correctas.',
            ], 401);
        }

        $token = $usuario->createToken($credenciales['nombre_token'] ?? 'Postman Refinery Import');

        return response()->json([
            'mensaje' => 'Token generado correctamente.',
            'token_type' => 'Bearer',
            'access_token' => $token->accessToken,
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->name,
                'email' => $usuario->email,
            ],
        ]);
    }

    /**
     * Muestra el usuario autenticado con el token Bearer actual.
     */
    public function usuario(Request $request): JsonResponse
    {
        $usuario = $request->user();

        return response()->json([
            'usuario' => [
                'id' => $usuario->id,
                'nombre' => $usuario->name,
                'email' => $usuario->email,
            ],
        ]);
    }

    /**
     * Revoca el token Bearer empleado en la solicitud.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->token()->revoke();

        return response()->json([
            'mensaje' => 'Token revocado correctamente.',
        ]);
    }
}
