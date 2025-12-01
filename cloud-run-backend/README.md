# Cloud Run Backend (Node.js + Express)

## 1. 環境変数とSecret管理

| 変数名 | 説明 | 例 |
| --- | --- | --- |
| `PORT` | ローカル開発時のポート | `8080` |
| `ALLOWED_ORIGINS` | CORS許可オリジン（カンマ区切り） | `https://tanqkikuchi.github.io` |
| `GCP_PROJECT_ID` | 使用するGCPプロジェクトID | `tanq-quest-prod` |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | サービスアカウントのメール | `backend@tanq-quest-prod.iam.gserviceaccount.com` |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | サービスアカウントの秘密鍵（改行は `\n` にエスケープ） | `"-----BEGIN PRIVATE KEY-----\\n..."` |
| `SPREADSHEET_ID` | 既存のメインスプレッドシートID | `1abcd...` |
| `IMAGE_FOLDER_ID` | Google Drive 画像フォルダID（将来Cloud Storageに差し替え可） | `1xyz...` |

### Secret Manager 推奨設定
- `GOOGLE_SERVICE_ACCOUNT_KEY` と `IMAGE_FOLDER_ID` など機微情報は Secret Manager に保存し、Cloud Run の **環境変数 > Secret** でマウント。
- `ALLOWED_ORIGINS` はステージング/本番で値が異なるため、`stg`,`prod` 用の ConfigMap/Secret を分ける。

#### サービスアカウント権限
- `Google Sheets API` → `Editor`
- `Google Drive API` → `File Editor`
- Cloud Run 実行用には `roles/run.invoker` を別Identityに付与

## 2. ローカル開発手順
1. `.env` を `.env.example` からコピーし、上記変数を設定
2. `npm install`
3. `npm run dev`（nodemon）で起動
4. `curl http://localhost:8080/health` で疎通確認

## 3. Cloud Run / Functions 2nd Gen デプロイ
- **Cloud Run + Docker**
  1. Dockerfileを追加（後述）。
  2. `gcloud builds submit --tag gcr.io/$PROJECT_ID/tanq-quest-api`。
  3. `gcloud run deploy tanq-quest-api --image gcr.io/$PROJECT_ID/tanq-quest-api --region=asia-northeast1 --allow-unauthenticated`。
  4. `ALLOWED_ORIGINS` 等の環境変数を `--set-env-vars` で指定、機微情報は `--set-secrets` を使用。

- **Cloud Functions 2nd gen**（軽量化したい場合）
  - `gcloud functions deploy auth --gen2 --runtime=nodejs20 --entry-point=handler --trigger-http` 等でエンドポイントごとに切り出す案も可能（ただしルータ構造を変更する必要あり）。

## 4. 監視とロギング
- Cloud Loggingで `severity>=ERROR` のフィルタを作成し、CORSエラーやSheetsエラーを検知。
- 今後 Cloud Monitoring で `5xx` レートにアラーム設定予定。

## 5. 今後の差し替えポイント
- 画像アップロードは現在Google Drive前提。`src/services/imageService.js` を作成し、Cloud Storage/Signed URL に切り替えられるよう抽象化する。
- 認証は将来的に Firebase Auth / Cloud Identity Platform を組み込む予定。ミドルウェア層で Bearer Token を検証できるよう構成する。

## 6. ディレクトリ構成（暫定）
```
cloud-run-backend/
├── src/
│   ├── config/        # 環境変数ローダー
│   ├── middleware/    # CORS, エラーハンドラ等
│   ├── routes/        # Express ルータ(auth, users, quests...)
│   ├── services/      # Sheets/Drive連携やドメインロジック
│   └── utils/         # 日付, バリデーション など共通処理
├── .env.example
├── Dockerfile (予定)
├── package.json
└── README.md
```
- `services/` は Sheets 依存をモジュール化しており、将来 Firestore/Cloud SQL 等に差し替える際はサービス層を置き換えるだけで済む。
- `routes/` は REST エンドポイントのみを定義し、レスポンス shape を統一 (`{ success: true, ... }`)。

## 7. npm スクリプト
| コマンド | 内容 |
| --- | --- |
| `npm run dev` | nodemon でローカル起動 (未設定、後で追加予定) |
| `npm run start` | `node src/index.js` |
| `npm run lint` | ESLint 標準ルールで静的解析 |

`npm run dev` は `nodemon` + `dotenv` 連携スクリプトを追加予定。必要に応じて `npm run test` なども拡張する。
