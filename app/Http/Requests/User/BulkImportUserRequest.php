<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class BulkImportUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Only OWNER/SUPER_ADMIN can bulk import users
        return $this->user()->hasPermissionTo('create-users');
    }

    public function rules(): array
    {
        return [
            'csv_file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'], // max 10MB
        ];
    }

    public function messages(): array
    {
        return [
            'csv_file.required' => 'File CSV harus dipilih.',
            'csv_file.mimes' => 'File harus berformat CSV atau TXT.',
            'csv_file.max' => 'File tidak boleh lebih dari 10MB.',
        ];
    }
}
