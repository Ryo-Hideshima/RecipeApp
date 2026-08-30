# RecipeApp — フロントエンド (Next.js)

レシピ共有アプリの Web フロントエンド。Next.js 16（App Router）/ TypeScript / Tailwind CSS v4。

プロジェクト全体の説明・セットアップ・デプロイは
[リポジトリルートの README](../README.md) と [`DEPLOY.md`](../DEPLOY.md) を参照。

## セットアップ

```sh
cp .env.example .env.local     # NEXT_PUBLIC_API_URL を API の URL に
npm install
npm run dev                    # http://localhost:3000
```

## 検証

```sh
npm run lint
npm run build
```

## 構成

| パス | 内容 |
|------|------|
| `src/app/` | 画面（App Router）。`recipes/` 一覧・詳細・投稿/編集、`users/` プロフィール・フォロー一覧・検索、`favorites/`、`login/` `register/`、`settings/profile/` |
| `src/components/` | `Header` / `RecipeCard` / `RecipeForm` / `UserRow` / `Avatar` / `RequireAuth`（認証ガード）ほか |
| `src/lib/api.ts` | API クライアント（Bearer トークン自動付与、`ApiError` で 422 を正規化） |
| `src/lib/auth.tsx` | `AuthProvider` / `useAuth`（トークンは localStorage、起動時に `GET /api/user`） |
| `src/lib/types.ts` | API レスポンスの型 |
| `Dockerfile` | 本番用（Next.js standalone、ECS Fargate で `node server.js`） |

認証はトークンベース（Sanctum PAT）。認証必須ページは `<RequireAuth>` でラップし、
未ログイン時は `/login` へ退避する。
