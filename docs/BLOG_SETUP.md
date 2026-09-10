# ブログ運用セットアップ（microCMS × Vercel）

お客様はスマホの microCMS 管理画面から記事を投稿します。公開すると Vercel が再ビルドし、静的 HTML が更新されます。

## 1. microCMS（作成済み想定）

- API: リスト形式 / エンドポイント名 `blogs`
- フィールド: `title` / `slug` / `description` / `body`

## 2. Vercel 環境変数

Vercel プロジェクト → Settings → Environment Variables に追加:

| Name | Value |
|------|--------|
| `MICROCMS_SERVICE_DOMAIN` | サービスドメイン（`https://〇〇.microcms.io` の 〇〇） |
| `MICROCMS_API_KEY` | microCMS の APIキー |

Production / Preview の両方に入れるのがおすすめです。

## 3. ビルド設定

- Build Command: `npm run build`（`package.json` の `build`）
- Output Directory: `public`（ビルドがサイト一式を `public/` に同期します）

環境変数が無いときは `blog/fixtures/posts.json` のサンプル記事で HTML を生成します。

## 4. 公開で自動反映（Deploy Hook）

1. Vercel → Settings → Git → **Deploy Hooks** で Hook を作成（例: 名前 `microcms-blog`）
2. 発行された URL をコピー
3. microCMS → サービス設定 → API → Webhook  
   - トリガー: コンテンツの公開・更新・削除など  
   - URL: Vercel の Deploy Hook  
4. 保存後、テスト記事を公開してサイトが更新されるか確認

## 5. ドメイン変更時

`site.config.json` の `siteUrl` を独自ドメインに変更し、再デプロイしてください。`robots.txt` / `sitemap.xml` / canonical が追従します。

## 6. ローカル確認

```bash
# サンプル記事で生成
npm run build

# microCMS から生成（.env は Vercel 側推奨。ローカルなら環境変数を一時設定）
set MICROCMS_SERVICE_DOMAIN=your-domain
set MICROCMS_API_KEY=your-key
npm run build
```

生成物: `blog/index.html` / `blog/{slug}.html` / `sitemap.xml`
