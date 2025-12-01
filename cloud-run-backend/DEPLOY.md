# Cloud Run デプロイ手順（プロトタイプ版）

## 前提条件
- Google Cloud Platform (GCP) アカウント
- `gcloud` CLI がインストール済み
- GCPプロジェクトが作成済み

## 1. GCPプロジェクトの設定

```bash
# プロジェクトIDを設定（実際のプロジェクトIDに置き換え）
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable drive.googleapis.com
```

## 2. サービスアカウントの作成と権限設定

```bash
# サービスアカウント作成
gcloud iam service-accounts create tanq-quest-backend \
  --display-name="Tanq Quest Backend Service Account"

# サービスアカウントのメールアドレスを取得
export SA_EMAIL="tanq-quest-backend@${PROJECT_ID}.iam.gserviceaccount.com"

# スプレッドシートとDriveへのアクセス権限を付与
# 注意: スプレッドシートの共有設定で、このサービスアカウントに「編集者」権限を付与してください
```

## 3. サービスアカウントキーの作成

```bash
# キーを作成
gcloud iam service-accounts keys create key.json \
  --iam-account=$SA_EMAIL

# 秘密鍵を環境変数形式に変換（改行を\nにエスケープ）
export PRIVATE_KEY=$(cat key.json | jq -r '.private_key' | sed 's/$/\\n/' | tr -d '\n')
```

## 4. Secret Manager への保存（推奨）

```bash
# Secret Manager API有効化
gcloud services enable secretmanager.googleapis.com

# 秘密鍵をSecret Managerに保存
echo -n "$PRIVATE_KEY" | gcloud secrets create google-service-account-key \
  --data-file=-

# スプレッドシートIDをSecretに保存
echo -n "your-spreadsheet-id" | gcloud secrets create spreadsheet-id \
  --data-file=-

# 画像フォルダIDをSecretに保存
echo -n "your-drive-folder-id" | gcloud secrets create image-folder-id \
  --data-file=-
```

## 5. Dockerイメージのビルドとプッシュ

```bash
# Cloud Buildでビルド
gcloud builds submit --tag gcr.io/$PROJECT_ID/tanq-quest-api

# または、ローカルでビルドしてプッシュ
docker build -t gcr.io/$PROJECT_ID/tanq-quest-api .
docker push gcr.io/$PROJECT_ID/tanq-quest-api
```

## 6. Cloud Runへのデプロイ

### Secret Managerを使用する場合（推奨）

```bash
gcloud run deploy tanq-quest-api \
  --image gcr.io/$PROJECT_ID/tanq-quest-api \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --service-account=$SA_EMAIL \
  --set-env-vars="ALLOWED_ORIGINS=https://tanqkikuchi.github.io,NODE_ENV=production" \
  --set-secrets="GOOGLE_SERVICE_ACCOUNT_KEY=google-service-account-key:latest,SPREADSHEET_ID=spreadsheet-id:latest,IMAGE_FOLDER_ID=image-folder-id:latest" \
  --set-env-vars="GOOGLE_SERVICE_ACCOUNT_EMAIL=$SA_EMAIL,GCP_PROJECT_ID=$PROJECT_ID"
```

### 環境変数を直接設定する場合（簡易版、非推奨）

```bash
gcloud run deploy tanq-quest-api \
  --image gcr.io/$PROJECT_ID/tanq-quest-api \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --service-account=$SA_EMAIL \
  --set-env-vars="ALLOWED_ORIGINS=https://tanqkikuchi.github.io,NODE_ENV=production,GOOGLE_SERVICE_ACCOUNT_EMAIL=$SA_EMAIL,GCP_PROJECT_ID=$PROJECT_ID,GOOGLE_SERVICE_ACCOUNT_KEY=$PRIVATE_KEY,SPREADSHEET_ID=your-spreadsheet-id,IMAGE_FOLDER_ID=your-drive-folder-id"
```

## 7. デプロイURLの取得

```bash
# デプロイURLを取得
gcloud run services describe tanq-quest-api \
  --region=asia-northeast1 \
  --format="value(status.url)"
```

このURLを `frontend/js/config.js` の `API_BASE_URL` に設定してください。

## 8. 動作確認

```bash
# ヘルスチェック
curl https://your-cloud-run-url/health

# ログインAPIテスト（実際のメールアドレスに置き換え）
curl -X POST https://your-cloud-run-url/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## トラブルシューティング

### CORSエラーが発生する場合
- `ALLOWED_ORIGINS` に正しいオリジンが設定されているか確認
- Cloud Runのログでエラー内容を確認: `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tanq-quest-api" --limit=50`

### サービスアカウントの権限エラー
- スプレッドシートの共有設定でサービスアカウントに「編集者」権限を付与
- Driveフォルダにも同様に権限を付与

### デプロイエラー
- Dockerfileの構文を確認
- `package.json` の `engines.node` が `>=18` になっているか確認
