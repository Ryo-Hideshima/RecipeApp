<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * 固定のカテゴリマスタ。要件上ユーザーは追加できず、ここで投入したものだけを使う。
     */
    public const NAMES = [
        '和食',
        '洋食',
        '中華',
        'イタリアン',
        'デザート',
        'サラダ',
        'スープ',
        '麺類',
        'ごはんもの',
        '朝食',
        'お弁当',
        'おつまみ',
    ];

    public function run(): void
    {
        foreach (self::NAMES as $name) {
            Category::firstOrCreate(['name' => $name]);
        }
    }
}
