<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only SUPER_ADMIN can create users with OWNER role
        if ($this->input('role') === 'OWNER') {
            return $this->user()->hasRole('SUPER_ADMIN');
        }
        
        return $this->user()->hasPermissionTo('create-users');
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email,NULL,id,deleted_at,NULL'],
            'phone' => ['nullable', 'string', 'max:20', 'unique:users,phone,NULL,id,deleted_at,NULL'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', 'string', 'in:OWNER,MANAGER,CASHIER,WAREHOUSE'],
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
