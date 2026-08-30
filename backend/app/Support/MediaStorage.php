<?php

namespace App\Support;

use Illuminate\Contracts\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * ユーザーアップロード画像（レシピ写真・アイコン）の保存先ディスクへの単一の入口。
 * ディスクは config('filesystems.media_disk')（既定 public、S3 へ切替可能）で決まる。
 */
class MediaStorage
{
    public static function disk(): Filesystem
    {
        return Storage::disk(config('filesystems.media_disk'));
    }

    /**
     * アップロードファイルを指定ディレクトリに保存し、保存された相対パスを返す。
     * S3 でも URL 公開できるよう public 可視性で保存する。
     */
    public static function store(UploadedFile $file, string $directory): string
    {
        return self::disk()->putFile($directory, $file, 'public');
    }

    public static function delete(?string $path): void
    {
        if ($path !== null && $path !== '') {
            self::disk()->delete($path);
        }
    }

    public static function url(?string $path): ?string
    {
        return $path ? self::disk()->url($path) : null;
    }
}
