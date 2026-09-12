# でかぼ御籤

浮世絵の風神雷神演出と、デカボ行動を組み合わせたおみくじWebアプリです。

## Stack

- Next.js 15
- React 19
- TypeScript
- CSS Animation

## Local development

```bash
npm install
npm run dev
```

`http://localhost:3000` を開いて確認できます。

## Vercel

GitHubリポジトリをVercelにImportしてください。

- Framework Preset: **Next.js**（通常は自動検出）
- Build Command: `next build`（自動設定でOK）
- Output Directory: **指定不要**
- Root Directory: `./`

環境変数は現在不要です。
