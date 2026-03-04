# ✦ TaskFlow — 社内タスク管理

Slack通知対応の社内タスク管理システムです。

## ローカルで動かす

```bash
npm install
npm run dev
```

## Vercelへのデプロイ手順

1. このフォルダをGitHubリポジトリにプッシュ
2. [vercel.com](https://vercel.com) でGitHubアカウントと連携
3. 「New Project」→ このリポジトリを選択 → 「Deploy」
4. 発行されたURLを社内に共有

## Slack通知の設定

アプリ起動後、ヘッダーの「💬 Slack 設定」から Incoming Webhook URL を設定してください。
