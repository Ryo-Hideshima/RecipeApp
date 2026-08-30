# デプロイ手順 (AWS)

すべて AWS。IaC は Terraform (`infra/`)。

```
                    ┌───────────── CloudFront (HTTPS, *.cloudfront.net) ─────────────┐
   ブラウザ ──HTTPS──▶                       │                                        │
                    └──HTTP──▶ ALB ──┬── /api/*, /up, /storage/* ──▶ ECS: backend (Laravel, Fargate)
                                     └── それ以外 ──────────────────▶ ECS: frontend (Next.js, Fargate)
                                                                         │
                              RDS MySQL (t3.micro)  ◀──────────────────┘
                              S3 (レシピ写真・アイコン, 公開読み取り)
```

| リソース | 用途 |
|----------|------|
| CloudFront | ビューワー HTTPS 終端。キャッシュ無効 (API/SSR) |
| ALB | パスベースルーティング (`/api/*` → backend, それ以外 → frontend) |
| ECS Fargate ×2 | backend (Laravel, ポート8080) / frontend (Next.js standalone, ポート3000)。ARM64 |
| RDS MySQL | `db.t3.micro`・初年は無料枠 |
| S3 | 画像。バケットポリシーで `s3:GetObject` を公開 |
| ECR ×2 | backend / frontend のイメージ |

**フロントとバックエンドは CloudFront で同一オリジン**になるため、`NEXT_PUBLIC_API_URL` は
`https://<cloudfront>/api`、CORS 設定は不要。

---

## 前提

- `aws` CLI が認証済み（`aws sts get-caller-identity` が通る）
- Terraform 1.6+
- Docker が起動している
- 必要な IAM 権限: ECS / ECR / EC2(VPC) / RDS / S3 / CloudFront / IAM / CloudWatch Logs / ELB

---

## 1. インフラ構築 (Terraform)

```sh
cd infra
terraform init
terraform plan       # 作成されるリソースを確認
terraform apply
```

- RDS の作成に 5〜10 分ほどかかる
- `apply` 時点では ECS サービスはイメージ未 push のためタスク 0 で待機する（正常）

主な出力:

```sh
terraform output site_url        # アプリの URL
terraform output api_url          # API のベース URL
terraform output -raw db_password # RDS パスワード (sensitive)
```

## 2. イメージのビルド & デプロイ

```sh
cd ..
./scripts/deploy.sh
```

このスクリプトが行うこと:

1. ECR にログイン
2. `backend/` を `serversideup/php:8.4-fpm-nginx` ベースでビルド → ECR へ push
3. `frontend/` を Next.js standalone でビルド（`NEXT_PUBLIC_API_URL` を `terraform output` から埋め込み）→ ECR へ push
4. 両 ECS サービスを `--force-new-deployment` でロールアウト
5. `aws ecs wait services-stable` で安定まで待機

backend コンテナは起動時に `php artisan migrate --force` と `db:seed --force`（カテゴリマスタ）を実行する。
バックエンドサービスは常時タスク 1 個構成（`deployment_maximum_percent = 100`）なのでマイグレーションは競合しない。

## 3. 動作確認

```sh
open "$(terraform -chdir=infra output -raw site_url)"
```

- `/register` で新規登録 → レシピ一覧へ
- レシピ投稿で画像を添付 → 詳細で画像が表示される（S3 連携の確認）

---

## 更新デプロイ

コードを変更したら再度:

```sh
./scripts/deploy.sh
```

インフラ定義（`infra/`）を変更したら:

```sh
cd infra && terraform apply
```

---

## 片付け

```sh
cd infra && terraform destroy
```

`force_destroy = true` を設定してあるため S3 / ECR にオブジェクトが残っていても削除される。
RDS は `skip_final_snapshot = true`。

---

## コスト目安（東京リージョン・概算）

| | 月額 |
|---|---|
| ECS Fargate (0.25 vCPU / 0.5GB × 2 タスク常時) | 約 $18 |
| ALB | 約 $18 + LCU |
| RDS `db.t3.micro` | 初年 $0（無料枠 750h）→ 以降 約 $13 |
| CloudFront / S3 / ECR / CloudWatch | 数百円（低トラフィック時） |
| **合計** | **初年 約 $40 / 月、以降 約 $55 / 月** |

停止したいときは `terraform destroy`、または ECS サービスの `desired_count` を 0 にして
RDS を停止する。
