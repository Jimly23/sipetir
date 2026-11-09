<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaseController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Dashboard — all authenticated users
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Cases
    Route::get('/cases', [CaseController::class, 'index']);
    Route::get('/cases/{id}', [CaseController::class, 'show']);

    // Cases — create/edit (admin, operator, penyidik)
    Route::middleware('role:admin,operator,penyidik')->group(function () {
        Route::post('/cases', [CaseController::class, 'store']);
        Route::put('/cases/{id}', [CaseController::class, 'update']);
        Route::patch('/cases/{id}', [CaseController::class, 'update']);
    });

    // Cases — delete (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::delete('/cases/{id}', [CaseController::class, 'destroy']);
    });

    // Categories — read (all authenticated)
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    // Categories — manage (admin only)
    Route::middleware('role:admin')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
        Route::post('/categories/{categoryId}/subcategories', [CategoryController::class, 'storeSubcategory']);
        Route::delete('/categories/{categoryId}/subcategories/{subcategoryId}', [CategoryController::class, 'destroySubcategory']);
    });

    // Reports — admin, pimpinan
    Route::middleware('role:admin,pimpinan,operator,penyidik')->group(function () {
        Route::get('/reports', [ReportController::class, 'index']);
        Route::get('/reports/export', [ReportController::class, 'export']);
    });

    // Users — admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::put('/users/{id}', [UserController::class, 'update']);
    });

    // Officers list for dropdown (all authenticated)
    Route::get('/officers', [UserController::class, 'officers']);
});
