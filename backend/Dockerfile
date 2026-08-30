# syntax=docker/dockerfile:1

FROM serversideup/php:8.4-fpm-nginx AS base

ENV PHP_OPCACHE_ENABLE=1 \
    PHP_POST_MAX_SIZE=12M \
    PHP_UPLOAD_MAX_FILE_SIZE=12M \
    AUTORUN_ENABLED=true \
    AUTORUN_LARAVEL_MIGRATION=false \
    AUTORUN_LARAVEL_STORAGE_LINK=false \
    AUTORUN_LARAVEL_CONFIG_CACHE=true \
    AUTORUN_LARAVEL_ROUTE_CACHE=true \
    AUTORUN_LARAVEL_EVENT_CACHE=true

WORKDIR /var/www/html

# 依存だけ先に入れてレイヤキャッシュを効かせる
COPY --chown=www-data:www-data composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY --chown=www-data:www-data . .
RUN composer dump-autoload --optimize --no-dev \
 && composer run-script post-autoload-dump \
 && rm -rf tests .github storage/logs/*.log

# 起動時にマイグレーション + カテゴリ投入（config/route/event キャッシュは AUTORUN が担当）
# 実行ビットは Git 管理下のファイルモードが COPY で保持される
COPY --chown=www-data:www-data docker/entrypoint.d/55-migrate.sh /etc/entrypoint.d/55-migrate.sh
