<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Laravel\Passport\Http\Controllers\AccessTokenController;
use Laravel\Passport\Passport;
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
            'scopes' => ['sometimes', 'array', 'min:1'],
            'scopes.*' => ['required', 'string', Rule::in(Passport::scopeIds())],
        ]);

        $scopes = $credenciales['scopes'] ?? Passport::defaultScopes();

        return $this->emitirToken([
            'grant_type' => 'password',
            'client_id' => config('services.passport.password_client_id'),
            'client_secret' => config('services.passport.password_client_secret'),
            'username' => $credenciales['email'],
            'password' => $credenciales['password'],
            'scope' => implode(' ', $scopes),
        ]);
    }

    /**
     * Muestra el usuario autenticado con el token Bearer actual.
     */
    public function usuario(Request $request): Response
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
    public function logout(Request $request): Response
    {
        $token = $request->user()->token();
        $refreshToken = $token->refreshToken;

        $token->revoke();
        $refreshToken?->revoke();

        return response()->json([
            'mensaje' => 'Sesión cerrada y tokens revocados correctamente.',
        ]);
    }

    /**
     * Entrega la solicitud al servidor OAuth de Passport sin hacer una
     * petición HTTP recursiva contra el mismo servidor de desarrollo.
     */
    private function emitirToken(array $parametros): Response
    {
        $solicitud = Request::create('/oauth/token', 'POST', $parametros);
        $solicitud->headers->set('Accept', 'application/json');

        $solicitudPsr = (new PsrHttpFactory)->createRequest($solicitud);

        return app(AccessTokenController::class)->issueToken(
            $solicitudPsr,
            app(ResponseInterface::class),
        );
    }
}
