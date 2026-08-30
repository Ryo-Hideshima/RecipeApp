<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\RecipeController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/recipes', [RecipeController::class, 'index']);
Route::get('/recipes/{recipe}', [RecipeController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);

    Route::post('/recipes', [RecipeController::class, 'store']);
    Route::put('/recipes/{recipe}', [RecipeController::class, 'update']);
    Route::delete('/recipes/{recipe}', [RecipeController::class, 'destroy']);

    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/recipes/{recipe}/favorite', [FavoriteController::class, 'store']);
    Route::delete('/recipes/{recipe}/favorite', [FavoriteController::class, 'destroy']);
});
