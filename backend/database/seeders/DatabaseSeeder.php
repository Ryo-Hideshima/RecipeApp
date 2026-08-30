<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Comment;
use App\Models\Ingredient;
use App\Models\Recipe;
use App\Models\RecipeStep;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(CategorySeeder::class);

        if (! app()->environment('local')) {
            return;
        }

        $categories = Category::all();

        $testUser = User::factory()->create([
            'name' => 'テストユーザー',
            'email' => 'test@example.com',
            'bio' => '動作確認用のアカウントです。',
        ]);

        $users = User::factory(5)->create()->push($testUser);

        Recipe::factory(15)
            ->recycle($users)
            ->create()
            ->each(function (Recipe $recipe) use ($categories, $users) {
                Ingredient::factory(rand(3, 6))->sequence(
                    fn ($sequence) => ['sort_order' => $sequence->index + 1],
                )->create(['recipe_id' => $recipe->id]);

                RecipeStep::factory(rand(2, 5))->sequence(
                    fn ($sequence) => ['step_number' => $sequence->index + 1],
                )->create(['recipe_id' => $recipe->id]);

                $recipe->categories()->attach(
                    $categories->random(rand(1, 3))->pluck('id')->all(),
                );

                Comment::factory(rand(0, 4))
                    ->recycle($users)
                    ->create(['recipe_id' => $recipe->id]);

                $recipe->favoredBy()->attach(
                    $users->random(rand(0, $users->count()))->pluck('id')->all(),
                    ['created_at' => now()],
                );
            });

        // フォロー関係をランダムに張る
        $users->each(function (User $user) use ($users) {
            $targets = $users->where('id', '!=', $user->id)->random(rand(0, 3));
            foreach ($targets as $target) {
                $user->following()->syncWithoutDetaching([
                    $target->id => ['created_at' => now()],
                ]);
            }
        });
    }
}
