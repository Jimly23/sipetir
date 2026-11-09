<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    // Role checks
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isPimpinan(): bool
    {
        return $this->role === 'pimpinan';
    }

    public function isOperator(): bool
    {
        return $this->role === 'operator';
    }

    public function isPenyidik(): bool
    {
        return $this->role === 'penyidik';
    }

    public function canEditCases(): bool
    {
        return in_array($this->role, ['admin', 'operator', 'penyidik']);
    }

    public function canManageUsers(): bool
    {
        return $this->isAdmin();
    }

    public function canManageCategories(): bool
    {
        return $this->isAdmin();
    }

    // Relationships
    public function assignedCases()
    {
        return $this->hasMany(CaseRecord::class, 'officer_id');
    }

    public function createdCases()
    {
        return $this->hasMany(CaseRecord::class, 'created_by');
    }

    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
