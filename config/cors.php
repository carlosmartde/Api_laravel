<?php

$configuredOrigins = implode(',', array_filter([
    env('CORS_ALLOWED_ORIGINS', 'http://localhost:8081,http://127.0.0.1:8081'),
    env('EXTERNAL_API_ALLOWED_ORIGINS', ''),
]));

$origins = array_values(array_unique(array_filter(array_map(
    'trim',
    explode(',', $configuredOrigins),
))));

return [
    'paths' => ['api/*', 'oauth/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $origins,
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
