# RecipeApp — レシピ共有アプリ

[![CI](https://github.com/Ryo-Hideshima/RecipeApp/actions/workflows/ci.yml/badge.svg)](https://github.com/Ryo-Hideshima/RecipeApp/actions/workflows/ci.yml)

レシピを投稿・検索・お気に入りでき、フォローで好みの投稿者を追いかけられる学習用の
レシピ共有アプリ。Next.js + Laravel + MySQL のフルスタック構成で、AWS 上に本番デプロイ済み。

## 🔗 デモ

**https://d3esqm93yvbtbp.cloudfront.net**

📹 デモ動画: [`docs/media/demo.mp4`](docs/media/demo.mp4)

すぐ試せるデモアカウント（パスワードは全員 `password123`）:

| メールアドレス | 表示名 |
|----------------|--------|
| `haruka.demo@example.com` | はるか |
| `kenta.demo@example.com` | ケンタ |
| `mio.demo@example.com` | みお |
| `yuto.demo@example.com` | ゆうと |

未ログインでもレシピの閲覧・検索は可能。投稿・お気に入り・コメント・フォローはログインが必要。

---

## 機能

| 機能 | 概要 |
|------|------|
| ユーザー登録・ログイン | メール／パスワード認証（Laravel Sanctum のトークン認証） |
| プロフィール | 表示名・自己紹介・アイコン画像の設定 |
| レシピ投稿 | タイトル・材料（複数）・手順（順序付き）・写真（複数）・カテゴリ（複数）。編集・削除は投稿者本人のみ |
| レシピ一覧・検索 | 新着順一覧、タイトル／材料名の部分一致検索、カテゴリ絞り込み |
| お気に入り | レシピのお気に入り登録／解除、お気に入り一覧 |
| コメント | レシピへのコメント投稿・削除 |
| フォロー | ユーザーのフォロー／解除、フォロー中／フォロワー一覧 |
| ユーザー検索 | 表示名でのユーザー検索 |

詳細な仕様は [`docs/`](docs/) を参照:

- [要件定義書](docs/requirements.md)
- [機能定義書](docs/features.md)（各機能の詳細は [`docs/features/`](docs/features/)）
- [画面設計](docs/screens.md)（全9画面・画面遷移図）
- [ER 図・テーブル定義](docs/er-diagram.md)

実装前のイメージ確認用に、依存なしの単一 HTML プロトタイプも用意（[`prototype/index.html`](prototype/index.html)）。

---

## 技術スタック

| レイヤー | 使用技術 |
|----------|----------|
| フロントエンド | Next.js 16（App Router）/ TypeScript / Tailwind CSS v4 |
| バックエンド | PHP 8.4 / Laravel 13 / Laravel Sanctum |
| データベース | MySQL 8 |
| 画像ストレージ | ローカル: `storage/app/public` ／ 本番: Amazon S3（`MEDIA_DISK` で切替） |
| テスト | PHPUnit（バックエンド 68 ケース）/ ESLint + `next build`（フロントエンド） |
| CI | GitHub Actions（backend: Pint + `php artisan test` / frontend: lint + build） |
| インフラ | Terraform（`infra/`）: ECS Fargate ×2 / ALB / CloudFront / RDS MySQL / S3 |

---

## アーキテクチャ（本番）

```
                 ┌──────────── CloudFront (HTTPS) ────────────┐
  ブラウザ ─HTTPS─▶                    │                       │
                 └─HTTP─▶ ALB ─┬─ /api/*, /up, /storage/* ─▶ ECS: backend  (Laravel)
                               └─ それ以外 ────────────────▶ ECS: frontend (Next.js)
                                                                  │
                          RDS MySQL  ◀───────────────────────────┘
                          S3 (レシピ写真・アイコン)
```

フロントエンドと API は CloudFront で同一オリジンになるため CORS 設定は不要。
デプロイ手順・環境変数・コスト目安は [`DEPLOY.md`](DEPLOY.md) を参照。

---

## ローカル開発

### 必要なもの

- PHP 8.3+ / Composer
- Node.js 20+
- Docker（MySQL 用。SQLite を使う場合は不要）

### 手順（MySQL）

```sh
# 1. MySQL を起動
docker compose up -d

# 2. バックエンド
cd backend
cp .env.example .env
php artisan key:generate
php artisan migrate --seed          # スキーマ + カテゴリマスタ + 開発用サンプルデータ
php artisan storage:link            # 画像を配信できるようにする
php artisan serve --port=8000       # http://localhost:8000

# 3. フロントエンド（別ターミナル）
cd frontend
cp .env.example .env.local          # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev                         # http://localhost:3000
```

### Docker を使わない場合（SQLite）

```sh
cd backend
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
DB_CONNECTION=sqlite DB_DATABASE=database/database.sqlite php artisan migrate --seed
DB_CONNECTION=sqlite DB_DATABASE=database/database.sqlite php artisan serve --port=8000
```

---

## テスト

```sh
# バックエンド
cd backend
./vendor/bin/pint --test     # コードスタイル
php artisan test             # 68 ケース

# フロントエンド
cd frontend
npm run lint
npm run build
```

CI（GitHub Actions）で PR ごとに上記すべてを自動実行している。

---

## ディレクトリ構成

```
.
├── backend/          Laravel API（app / routes/api.php / database/migrations / tests）
├── frontend/         Next.js（src/app 画面 / src/components / src/lib API クライアント・認証）
├── infra/            Terraform（AWS: ECS / ALB / CloudFront / RDS / S3）
├── scripts/          deploy.sh（イメージ build/push + ECS ロールアウト）
├── docs/             要件定義・機能定義・画面設計・ER 図
├── prototype/        依存なしの単一 HTML プロトタイプ
├── docker-compose.yml  ローカル MySQL
├── DEPLOY.md         AWS デプロイ手順
└── CLAUDE.md         開発ワークフローの定義
```

---

## 開発フロー

GitHub Issue → `main` からブランチ作成 → 実装 → ローカル検証 → PR → CI グリーン確認 →
明示指示でマージ、というフローで進めた。詳細は [`CLAUDE.md`](CLAUDE.md)。

要件定義 → CI 導入 → バックエンド API（機能ごと）→ フロントエンド（画面ごと）→ AWS デプロイ、
という順に 20 本以上の PR を積み上げている（1 機能 = 1 PR、すべて CI グリーンでマージ）。
