# デプロイ手順

本番構成:

| レイヤー | サービス | 補足 |
|----------|----------|------|
| フロントエンド | **Vercel** | `frontend/` を Next.js プロジェクトとしてデプロイ |
| バックエンド | **Laravel Cloud** | `backend/` を Laravel アプリとしてデプロイ |
| データベース | **Laravel Cloud の MySQL** | アプリにアタッチ |
| 画像ストレージ | **Laravel Cloud のオブジェクトストレージ**（S3 互換） | `MEDIA_DISK=s3` |

両サービスとも GitHub 連携で `main` への push を自動デプロイする。CI（GitHub Actions）が緑になってからマージ → 自動デプロイ、という流れ。

---

## 前提

- リポジトリが GitHub にある（済み: `Ryo-Hideshima/RecipeApp`）
- [Vercel](https://vercel.com) アカウント
- [Laravel Cloud](https://cloud.laravel.com) アカウント

---

## 1. バックエンド（Laravel Cloud）

### 1-1. アプリ作成

1. Laravel Cloud で **Create Application** → GitHub リポジトリ `RecipeApp` を選択
2. **Application path** に `backend` を指定（モノレポのため）
3. PHP バージョン: 8.4 / リージョンは任意

### 1-2. データベース

1. アプリの **Database** で **MySQL** を作成しアタッチ
2. `DB_*` 環境変数は Laravel Cloud が自動注入する（手動設定不要）

### 1-3. オブジェクトストレージ（画像）

Laravel Cloud コンテナのファイルシステムはデプロイごとに揮発するため、画像は必ず外部ストレージへ。

1. アプリの **Storage** で S3 互換バケットを作成
2. 発行された認証情報を下記の環境変数に設定

### 1-4. 環境変数

| 変数 | 値 |
|------|----|
| `APP_NAME` | `Recipe` |
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | Laravel Cloud が生成（**Generate App Key**） |
| `APP_URL` | 発行されたバックエンドの URL（例 `https://recipeapp-xxxx.laravel.cloud`） |
| `MEDIA_DISK` | `s3` |
| `AWS_ACCESS_KEY_ID` | ストレージのキー |
| `AWS_SECRET_ACCESS_KEY` | ストレージのシークレット |
| `AWS_DEFAULT_REGION` | バケットのリージョン |
| `AWS_BUCKET` | バケット名 |
| `AWS_ENDPOINT` | S3 互換エンドポイント URL |
| `AWS_URL` | 公開 URL のベース（例 `https://<bucket>.<endpoint>`） |
| `AWS_USE_PATH_STYLE_ENDPOINT` | プロバイダに応じて `true` / `false` |
| `SESSION_DRIVER` | `database` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |
| `FRONTEND_URL` | Vercel の URL（CORS を絞る場合に使用。未設定なら全オリジン許可のまま） |

> トークンベース認証（Sanctum の Personal Access Token）なので Cookie/セッションのクロスドメイン設定は不要。`SANCTUM_STATEFUL_DOMAINS` も不要。

### 1-5. デプロイコマンド

アプリの **Deployment** 設定の deploy スクリプトに以下を含める:

```sh
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan db:seed --force        # カテゴリマスタ投入（冪等・本番では CategorySeeder のみ実行）
php artisan config:cache
php artisan route:cache
php artisan event:cache
```

### 1-6. デプロイ

**Deploy** を実行。完了後、`https://<backend-url>/api/categories` が JSON を返せば OK。

---

## 2. フロントエンド（Vercel）

### 2-1. プロジェクト作成

1. Vercel で **Add New… → Project** → `RecipeApp` を Import
2. **Root Directory** に `frontend` を指定
3. Framework Preset は **Next.js**（自動検出）

### 2-2. 環境変数

| 変数 | 値 |
|------|----|
| `NEXT_PUBLIC_API_URL` | `https://<backend-url>/api` （末尾の `/api` まで含める） |

> `NEXT_PUBLIC_` はビルド時にバンドルへ埋め込まれる。変更したら再デプロイが必要。

### 2-3. デプロイ

**Deploy** を実行。完了後、トップページが `/recipes` にリダイレクトされ、レシピ一覧が表示されれば OK。

---

## 3. 動作確認

1. `/register` で新規登録 → レシピ一覧へ
2. `/recipes/new` でレシピ投稿（画像添付） → 詳細で画像が表示される（= オブジェクトストレージ連携 OK）
3. お気に入り・コメント・フォロー・ユーザー検索

---

## 4. 以降の更新

`main` に push（PR マージ）すると Vercel / Laravel Cloud が自動で再デプロイする。
バックエンドのマイグレーションは deploy スクリプトの `migrate --force` で毎回適用される。

---

## 5. CORS を絞る場合（任意）

デフォルトでは `api/*` が全オリジンを許可する。フロントの URL のみに制限したい場合は
`backend/config/cors.php` を作成:

```php
<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter([env('FRONTEND_URL')]),
    'allowed_origins_patterns' => ['#^https://.*\.vercel\.app$#'],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
```
