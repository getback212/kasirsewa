<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * Base exception for KasirSewa domain errors
 * Renders user-friendly messages; logs internal details
 */
class KasirSewaException extends Exception
{
    protected string $userMessage;

    protected bool $shouldLog = true;

    public function __construct(
        string $userMessage,
        string $internalMessage = '',
        int $code = 0,
        ?\Throwable $previous = null
    ) {
        $this->userMessage = $userMessage;

        parent::__construct(
            $internalMessage ?: $userMessage,
            $code,
            $previous
        );
    }

    public function getUserMessage(): string
    {
        return $this->userMessage;
    }

    public function shouldLog(): bool
    {
        return $this->shouldLog;
    }

    /**
     * Render as JSON (API)
     */
    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->userMessage,
            'error' => true,
        ], $this->getCode() ?: 400);
    }
}
