<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'slug', 'description', 'is_active'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function subcategories()
    {
        return $this->hasMany(Subcategory::class);
    }

    public function activeSubcategories()
    {
        return $this->hasMany(Subcategory::class)->where('is_active', true);
    }

    public function cases()
    {
        return $this->hasMany(CaseRecord::class, 'category_id');
    }
}
