# RecipeApp — バックエンド (Laravel API)

レシピ共有アプリの API サーバー。PHP 8.4 / Laravel 13 / Laravel Sanctum。

プロジェクト全体の説明・セットアップ・デプロイは
[リポジトリルートの README](../README.md) と [`DEPLOY.md`](../DEPLOY.md) を参照。

## セットアップ

```sh
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
php artisan serve --port=8000
```

## テスト

```sh
./vendor/bin/pint --test     # コードスタイル (Laravel Pint)
php artisan test             # PHPUnit (68 ケース、SQLite in-memory)
```

## 主なディレクトリ

| パス | 内容 |
|------|------|
| `routes/api.php` | 全 API エンドポイント定義 |
| `app/Http/Controllers/` | コントローラ |
| `app/Http/Requests/` | バリデーション (FormRequest) |
| `app/Http/Resources/` | レスポンス整形 (API Resource) |
| `app/Models/` | Eloquent モデル |
| `app/Policies/` | 認可（レシピ・コメントの編集/削除） |
| `database/migrations/` | スキーマ |
| `database/seeders/` | `CategorySeeder`（カテゴリマスタ・本番でも実行）/ `DatabaseSeeder`（local のみサンプル） |
| `tests/Feature/` | 機能テスト |

## API エンドポイント

| メソッド | パス | 認証 | 用途 |
|----------|------|------|------|
| POST | `/api/register` | – | 新規登録（トークン発行） |
| POST | `/api/login` | – | ログイン |
| POST | `/api/logout` | ✓ | ログアウト（現トークン失効） |
| GET | `/api/user` | ✓ | ログイン中ユーザー |
| GET | `/api/categories` | – | カテゴリ一覧 |
| GET | `/api/recipes` | – | レシピ一覧・検索（`keyword` / `ingredient` / `category_ids[]`） |
| GET | `/api/recipes/{id}` | – | レシピ詳細 |
| POST | `/api/recipes` | ✓ | レシピ作成 |
| PUT | `/api/recipes/{id}` | ✓(本人) | レシピ編集 |
| DELETE | `/api/recipes/{id}` | ✓(本人) | レシピ削除 |
| POST | `/api/recipes/{id}/images` | ✓(本人) | 写真アップロード（複数） |
| DELETE | `/api/recipes/{id}/images/{img}` | ✓(本人) | 写真削除 |
| GET / POST | `/api/recipes/{id}/comments` | GET:– / POST:✓ | コメント一覧・投稿 |
| DELETE | `/api/comments/{id}` | ✓(本人) | コメント削除 |
| POST / DELETE | `/api/recipes/{id}/favorite` | ✓ | お気に入り登録・解除 |
| GET | `/api/favorites` | ✓ | 自分のお気に入り一覧 |
| POST / DELETE | `/api/users/{id}/follow` | ✓ | フォロー・解除 |
| GET | `/api/users/{id}/following` `/followers` | ✓ | フォロー中・フォロワー一覧 |
| GET | `/api/users` | ✓ | ユーザー検索（`keyword`） |
| GET | `/api/users/{id}` | ✓ | プロフィール |
| GET | `/api/users/{id}/recipes` | ✓ | ユーザーの投稿レシピ |
| PATCH | `/api/profile` | ✓ | プロフィール編集 |
| POST / DELETE | `/api/profile/avatar` | ✓ | アイコン画像 |
