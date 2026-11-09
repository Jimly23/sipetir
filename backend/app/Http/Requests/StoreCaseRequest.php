<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->canEditCases();
    }

    public function rules(): array
    {
        return [
            'reporter_name' => 'required|string|max:255',
            'reporter_gender' => 'nullable|in:laki-laki,perempuan',
            'reporter_age' => 'nullable|integer|min:1|max:150',
            'reporter_occupation' => 'nullable|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'required|exists:subcategories,id',
            'material_loss' => 'required|numeric|min:0',
            'incident_date' => 'required|date|before_or_equal:today',
            'report_date' => 'required|date|before_or_equal:today',
            'description' => 'nullable|string|max:5000',
            'status' => 'nullable|in:laporan_masuk,dalam_penyelidikan,dalam_penyidikan,p21,sp3,selesai',
            'officer_id' => 'nullable|exists:users,id',
        ];
    }

    public function messages(): array
    {
        return [
            'reporter_name.required' => 'Nama pelapor wajib diisi.',
            'category_id.required' => 'Kategori wajib dipilih.',
            'category_id.exists' => 'Kategori tidak ditemukan.',
            'subcategory_id.required' => 'Subkategori wajib dipilih.',
            'subcategory_id.exists' => 'Subkategori tidak ditemukan.',
            'material_loss.required' => 'Total kerugian material wajib diisi.',
            'material_loss.numeric' => 'Total kerugian harus berupa angka.',
            'material_loss.min' => 'Total kerugian tidak boleh negatif.',
            'incident_date.required' => 'Tanggal kejadian wajib diisi.',
            'incident_date.before_or_equal' => 'Tanggal kejadian tidak boleh di masa depan.',
            'report_date.required' => 'Tanggal laporan wajib diisi.',
            'report_date.before_or_equal' => 'Tanggal laporan tidak boleh di masa depan.',
            'officer_id.exists' => 'Petugas tidak ditemukan.',
        ];
    }
}
