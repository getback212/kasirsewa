<?php

namespace App\Http\Requests\Customer;

use Illuminate\Foundation\Http\FormRequest;

class StoreCustomerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('create-customers');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'city' => ['nullable', 'string', 'max:100'],
            'credit_limit' => ['nullable', 'numeric', 'min:0'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'customer_type' => ['nullable', 'in:retail,wholesale,member'],
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
