<?php

namespace Tests\Feature;

use Database\Seeders\CategorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_list_categories(): void
    {
        $this->seed(CategorySeeder::class);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonCount(count(CategorySeeder::NAMES), 'data')
            ->assertJsonStructure(['data' => [['id', 'name']]])
            ->assertJsonPath('data.0.name', CategorySeeder::NAMES[0]);
    }
}
