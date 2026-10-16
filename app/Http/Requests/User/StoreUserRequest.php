<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermissionTo('create-users');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string'],
            'outlet_id' => ['required', 'exists:outlets,id'],
            'send_invite' => ['boolean'],
        ];
    }

    /**
     * Sanitize string inputs to prevent XSS
     */
    public function validated($key = null, $default = null): array
    {
        $validated = parent::validated($key, $default);

        foreach (['name', 'email', 'phone'] as $field) {
            if (isset($validated[$field]) && is_string($validated[$field])) {
                $validated[$field] = strip_tags(trim($validated[$field]));
            }
        }

        return $validated;
    }
}
