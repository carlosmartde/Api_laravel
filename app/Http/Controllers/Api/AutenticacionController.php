<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Passport\Http\Controllers\AccessTokenController;
use Psr\Http\Message\ResponseInterface;
use Symfony\Bridge\PsrHttpMessage\Factory\PsrHttpFactory;
use Symfony\Component\HttpFoundation\Response;

class AutenticacionController extends Controller
{
    public function login(Request $request): Response
    {
        $credenciales = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $usuario = User::query()->where('email', $credenciales['email'])->first();

        if (! $usuario || ! Hash::check($credenciales['password'], $usuario->password)) {
            return response()->json([
                'message' => 'El correo o la contraseña no son correctos.',
            ], 422);
        }

        if (! config('services.passport.password_client_id') || ! config('services.passport.password_client_secret')) {
            return response()->json([
                'message' => 'El acceso OAuth todavía no está configurado en el servidor.',
            ], 503);
        }

        $respuesta = $this->emitirToken([
            'grant_type' => 'password',
            'client_id' => config('services.passport.password_client_id'),
            'client_secret' => config('services.passport.password_client_secret'),
            'username' => $credenciales['email'],
            'password' => $credenciales['password'],
            'scope' => implode(' ', $usuario->allowedScopes()),
        ]);

        if ($respuesta->getStatusCode() === 200) {
            $contenido = json_decode($respuesta->getContent(), true);
            $contenido['user'] = $this->serializarUsuario($usuario);
            $respuesta->setContent(json_encode($contenido));
        }

        return $respuesta;
    }

    public function usuario(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $this->serializarUsuario($request->user()),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->token();
        $token->revoke();
        $token->refreshToken?->revoke();

        return response()->json(['message' => 'Sesión cerrada correctamente.']);
    }

    /**
     * @return array<string, mixed>
     */
    private function serializarUsuario(User $usuario): array
    {
        return [
            'id' => $usuario->id,
            'name' => $usuario->name,
            'email' => $usuario->email,
            'role' => $usuario->role,
            'permissions' => $usuario->allowedScopes(),
        ];
    }

    private function emitirToken(array $parametros): Response
    {
        $solicitud = Request::create('/oauth/token', 'POST', $parametros);
        $solicitud->headers->set('Accept', 'application/json');

        return app(AccessTokenController::class)->issueToken(
            (new PsrHttpFactory)->createRequest($solicitud),
            app(ResponseInterface::class),
        );
    }
}
