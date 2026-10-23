<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureExternalApiToken
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $adminToken = (string) config('external-api.admin_token', '');
        $consumerToken = (string) config('external-api.consumer_token', '');

        if ($adminToken === '' && $consumerToken === '') {
            return new JsonResponse([
                'message' => 'El acceso a la API externa no está configurado.',
            ], Response::HTTP_SERVICE_UNAVAILABLE);
        }

        $providedToken = (string) $request->bearerToken();

        $esAdministrador = $adminToken !== '' && hash_equals($adminToken, $providedToken);
        $esConsumidor = $consumerToken !== '' && hash_equals($consumerToken, $providedToken);

        if ($providedToken === '' || (! $esAdministrador && ! $esConsumidor)) {
            return new JsonResponse([
                'message' => 'Credenciales de API inválidas.',
            ], Response::HTTP_UNAUTHORIZED, [
                'WWW-Authenticate' => 'Bearer',
            ]);
        }

        if ($esConsumidor && ! in_array($request->method(), config('external-api.consumer_allowed_methods', []), true)) {
            return new JsonResponse([
                'message' => 'Esta credencial solo permite consultar y registrar importaciones.',
            ], Response::HTTP_FORBIDDEN);
        }

        $request->attributes->set('external_api_role', $esAdministrador ? 'admin' : 'consumer');

        return $next($request);
    }
}
