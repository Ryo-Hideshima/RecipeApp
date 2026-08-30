#!/bin/sh
# serversideup/php のエントリポイントから起動前に実行される。
# バックエンドサービスは常時タスク1個構成のためマイグレーションの競合は起きない。
set -e

php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction   # カテゴリマスタ（冪等・本番は CategorySeeder のみ）
