<?php

namespace App\Http\Requests\Outlet;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOutletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('edit-outlets');
    }

    public function rules(): array
    {
        $outletId = $this->route('id');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:50', Rule::unique('outlets', 'code')->ignore($outletId)],
            'address' => ['sometimes', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'qris_payload' => ['sometimes', 'nullable', 'string'],
            'qris_image_url' => ['sometimes', 'nullable', 'url'],
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
