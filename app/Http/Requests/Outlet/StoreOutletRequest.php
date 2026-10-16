<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;

class StoreOutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('create-outlets');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50'],
            'address' => ['required', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'city' => ['nullable', 'string', 'max:100'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'url'],
        ];
    }

    /**
     * Sanitize string inputs to prevent XSS
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        foreach (['name', 'code', 'address', 'phone', 'email', 'city'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strip_tags(trim($validated[$field]));
            }
        }

        return $validated;
    }
}
