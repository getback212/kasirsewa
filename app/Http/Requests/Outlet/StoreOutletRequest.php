<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('outlets', 'code')],
            'address' => ['required', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
            'qris_payload' => ['nullable', 'string'],
            'qris_image_url' => ['nullable', 'url'],
            'enable_ppn' => ['sometimes', 'boolean'],
            'tax_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * Sanitize string inputs to prevent XSS
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        foreach (['name', 'code', 'address', 'phone'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strip_tags(trim($validated[$field]));
            }
        }

        return $validated;
    }
}
