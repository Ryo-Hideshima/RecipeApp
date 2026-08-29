# CLAUDE.md

> このファイルは新しいプロジェクトのルートにそのままコピーすれば、同じ開発フロー(Issue→ブランチ→実装→PR→CI確認→明示指示でマージ)を再現できるテンプレートとして書いている(元はSNSappプロジェクトで確立したもの)。プロジェクト固有の内容(技術スタック等)と、汎用的なワークフロー部分を分けてあるので、コピーする際はワークフロー部分だけ流用すればよい。

## プロジェクト概要

レシピ共有アプリ。

- フロントエンド: `frontend/`(Next.js + TypeScript、App Router)
- バックエンド: `backend/`(PHP / Laravel)
- データベース: MySQL(`docker-compose.yml`でローカル起動)

### ローカル起動

```bash
docker compose up -d                          # MySQL

cd backend
cp .env.example .env                          # 初回のみ
php artisan key:generate                      # 初回のみ
php artisan migrate
php artisan serve --port=8000                 # http://localhost:8000

cd frontend
npm install                                    # 初回のみ
npm run dev                                    # http://localhost:3000
```

## 開発ワークフロー

### 絶対原則

**`main`ブランチに直接コミット・pushしない。** 作業は必ず専用のブランチ上で行う。

### 標準フロー

1. **GitHub Issueを作成する**

   ```bash
   gh issue create --title "◯◯機能の実装" --body "何を・なぜやるかを簡潔に"
   ```

2. **最新の`main`から作業ブランチを切る**

   ```bash
   git checkout main
   git pull origin main
   git checkout -b issue-<N>-short-slug   # <N>は上で作ったIssue番号
   ```

3. **実装し、コミット前にローカルで検証する**

   該当するテスト・lint・buildを実際に実行し、グリーンであることを確認してから次に進む(具体的に何を実行するかは後述の「CIについて」を参照)。

4. **コミットはユーザーから明示的に指示された時のみ行う**

   実装・検証が終わっても、ユーザーが「コミットして」等と言うまでは`git commit`しない。

5. **push→PRを作成する**

   ```bash
   git push -u origin issue-<N>-short-slug
   gh pr create --title "..." --body "..."
   ```

   PR本文は次の2セクション構成にする(日本語):

   ```markdown
   ## Summary
   - 何を変更したか、なぜそう設計したかを箇条書きで

   ## Test plan
   - [x] 実際に実行したコマンドと結果をチェックリストで
   ```

6. **CIがグリーンになるまで確認する**

   ```bash
   gh pr checks <PR番号>
   gh run watch <run-id> --exit-status
   ```

   CIが赤い場合は、憶測で直さず実際のログ(`gh run view --log-failed`)から原因を特定してから修正し、pushして再確認する。

7. **ユーザーが明示的に指示するまでは絶対にマージしない**

   CIが通っていても、「マージして」のような明確な指示がない限り`gh pr merge`は実行しない。マージ後はそのブランチでの作業を終え、次のタスクは必ず新しいブランチで始める。

### 陥りやすい罠: マージ済みブランチの上で作業を続けてしまう

前のタスクのブランチがマージされた後、そのままそのブランチ上で次のタスクの変更を始めてしまうミスが起きやすい。新しいタスクに着手する前に必ず次を確認する:

```bash
git branch --show-current
git log --oneline -1 origin/main
```

現在のブランチが既にマージ済み、または`main`より古い場合は、標準フローのステップ2に戻って`main`から切り直す。

### CIについて

新しい変更によってCIパイプラインを壊さないこと。pushする前に、CIで実行される内容と同じチェックをローカルで実行しておく。

**このプロジェクトはまだCI(GitHub Actions)を導入していない。** 導入する際は、SNSappプロジェクトの`.github/workflows/ci.yml`を参考に、少なくとも次を載せる想定:
- **backend(Laravel)**: `./vendor/bin/pint --test`(コードスタイル) → `php artisan test`(PHPUnit/Pest)
- **frontend(Next.js)**: `npm run lint` → `npm run build`

CIが無い間も、上記に相当するチェックをローカルで都度実行してからpushする。

### 費用・実害を伴う操作は実行前に必ず確認する

実際の課金やインフラ変更を伴う操作、本番DBへの書き込み、外部サービスへの通知送信などは、コードが完成していても、**実行そのものについて必ずユーザーに確認してから**行う。コードのレビュー・準備が終わっていることと、実際に実行してよいことは別の判断である。
