<?php

namespace App\Providers;

use Carbon\CarbonInterval;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Passport\Passport;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('external-api', function (Request $request): Limit {
            $consumerKey = $request->bearerToken()
                ? hash('sha256', (string) $request->bearerToken())
                : (string) $request->ip();

            return Limit::perMinute(
                max(1, (int) config('external-api.rate_limit_per_minute', 60)),
            )->by($consumerKey)->response(fn (Request $request, array $headers) => response()->json([
                'message' => 'Se alcanzó el límite de solicitudes. Inténtalo de nuevo más tarde.',
            ], 429, $headers));
        });

        RateLimiter::for('login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(strtolower((string) $request->input('email')).'|'.$request->ip());
        });

        Passport::enablePasswordGrant();
        Passport::tokensExpireIn(CarbonInterval::hours(8));
        Passport::refreshTokensExpireIn(CarbonInterval::days(30));

        Passport::tokensCan([
            'importaciones.read' => 'Consultar importaciones y su seguimiento',
            'importaciones.write' => 'Crear y actualizar importaciones',
            'importaciones.delete' => 'Eliminar importaciones',
            'admin' => 'Administrar toda la plataforma',
        ]);

        Passport::defaultScopes(['importaciones.read']);
    }
}
