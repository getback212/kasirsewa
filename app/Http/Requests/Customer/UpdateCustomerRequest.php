<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('update-customers');
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:20'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'credit_limit' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'customer_type' => ['sometimes', 'nullable', 'in:retail,wholesale,member'],
        ];
    }

    /**
     * Sanitize string inputs to prevent XSS
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        foreach (['name', 'phone', 'email', 'address', 'city', 'notes'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                // Strip HTML tags and trim whitespace
                $validated[$field] = strip_tags(trim($validated[$field]));
            }
        }

        return $validated;
    }
}
