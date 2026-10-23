<?php

return [
    'token' => env('EXTERNAL_API_TOKEN'),

    'rate_limit_per_minute' => (int) env('EXTERNAL_API_RATE_LIMIT', 60),

    'default_page_size' => (int) env('EXTERNAL_API_PAGE_SIZE', 25),
];
