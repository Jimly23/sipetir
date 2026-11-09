<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class CaseRecord extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'cases';

    protected $fillable = [
        'case_number',
        'reporter_name',
        'reporter_gender',
        'reporter_age',
        'reporter_occupation',
        'category_id',
        'subcategory_id',
        'material_loss',
        'incident_date',
        'report_date',
        'description',
        'status',
        'officer_id',
        'created_by',
        'updated_by',
    ];

    protected function casts(): array
    {
        return [
            'material_loss' => 'decimal:2',
            'incident_date' => 'date',
            'report_date' => 'date',
            'reporter_age' => 'integer',
        ];
    }

    // Status labels in Indonesian
    public static function statusLabels(): array
    {
        return [
            'laporan_masuk' => 'Laporan Masuk',
            'dalam_penyelidikan' => 'Dalam Penyelidikan',
            'dalam_penyidikan' => 'Dalam Penyidikan',
            'p21' => 'P-21',
            'sp3' => 'SP3',
            'selesai' => 'Selesai',
        ];
    }

    public function getStatusLabelAttribute(): string
    {
        return self::statusLabels()[$this->status] ?? $this->status;
    }

    // Generate case number: KS-YYYYMM-XXXX
    public static function generateCaseNumber(): string
    {
        $prefix = 'KS-' . now()->format('Ym') . '-';
        $maxCaseNumber = self::withTrashed()
            ->where('case_number', 'like', $prefix . '%')
            ->max('case_number');

        if ($maxCaseNumber) {
            $lastNumber = (int) substr($maxCaseNumber, strlen($prefix));
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        $candidate = $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
        while (self::withTrashed()->where('case_number', $candidate)->exists()) {
            $newNumber++;
            $candidate = $prefix . str_pad($newNumber, 4, '0', STR_PAD_LEFT);
        }

        return $candidate;
    }

    // Relationships
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory()
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function officer()
    {
        return $this->belongsTo(User::class, 'officer_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Scopes
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    public function scopeBySubcategory($query, $subcategoryId)
    {
        return $query->where('subcategory_id', $subcategoryId);
    }

    public function scopeByOfficer($query, $officerId)
    {
        return $query->where('officer_id', $officerId);
    }

    public function scopeByDateRange($query, $from, $to)
    {
        if ($from) $query->where('report_date', '>=', $from);
        if ($to) $query->where('report_date', '<=', $to);
        return $query;
    }

    public function scopeByMonth($query, $month, $year)
    {
        return $query->whereMonth('report_date', $month)->whereYear('report_date', $year);
    }
}
