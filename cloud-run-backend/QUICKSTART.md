# クイックスタートガイド（プロトタイプ版）

## 目標
CORS問題を解決し、ログイン機能が動作するプロトタイプを完成させる

## 最短手順（5ステップ）

### ステップ1: GCPプロジェクトの準備
```bash
export PROJECT_ID="your-project-id"
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com sheets.googleapis.com drive.googleapis.com
```

### ステップ2: サービスアカウントの作成
```bash
gcloud iam service-accounts create tanq-quest-backend \
  --display-name="Tanq Quest Backend"
export SA_EMAIL="tanq-quest-backend@${PROJECT_ID}.iam.gserviceaccount.com"
```

### ステップ3: スプレッドシートの共有設定
1. Googleスプレッドシートを開く
2. 「共有」ボタンをクリック
3. サービスアカウントのメールアドレス（`$SA_EMAIL`）を入力
4. 「編集者」権限を付与

### ステップ4: Cloud Runへのデプロイ

#### 4-1. 環境変数の準備
```bash
# サービスアカウントキーを取得（初回のみ）
gcloud iam service-accounts keys create key.json --iam-account=$SA_EMAIL
export PRIVATE_KEY=$(cat key.json | jq -r '.private_key' | sed 's/$/\\n/' | tr -d '\n')

# スプレッドシートIDとDriveフォルダIDを設定
export SPREADSHEET_ID="your-spreadsheet-id"
export IMAGE_FOLDER_ID="your-drive-folder-id"
```

#### 4-2. Dockerイメージのビルドとデプロイ
```bash
# プロジェクトルート（Cursor/）から実行
cd cloud-run-backend

# Cloud Buildでビルド＆デプロイ
gcloud builds submit --tag gcr.io/$PROJECT_ID/tanq-quest-api

# Cloud Runにデプロイ
gcloud run deploy tanq-quest-api \
  --image gcr.io/$PROJECT_ID/tanq-quest-api \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --service-account=$SA_EMAIL \
  --set-env-vars="ALLOWED_ORIGINS=https://tanqkikuchi.github.io,NODE_ENV=production,GOOGLE_SERVICE_ACCOUNT_EMAIL=$SA_EMAIL,GCP_PROJECT_ID=$PROJECT_ID,GOOGLE_SERVICE_ACCOUNT_KEY=$PRIVATE_KEY,SPREADSHEET_ID=$SPREADSHEET_ID,IMAGE_FOLDER_ID=$IMAGE_FOLDER_ID" \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=10
```

#### 4-3. デプロイURLの取得
```bash
export CLOUD_RUN_URL=$(gcloud run services describe tanq-quest-api \
  --region=asia-northeast1 \
  --format="value(status.url)")
echo "Cloud Run URL: $CLOUD_RUN_URL"
```

### ステップ5: フロントエンドの設定更新
1. `frontend/js/config.js` を開く
2. 20行目あたりのコメントアウトを解除し、Cloud Run URLを設定:
   ```javascript
   config.API_BASE_URL = 'https://your-cloud-run-url.run.app';
   ```
3. GitHubにコミット＆プッシュ
4. GitHub Pagesが更新されるまで数分待つ

## 動作確認

### バックエンドの確認
```bash
# ヘルスチェック
curl $CLOUD_RUN_URL/health

# ログインAPIテスト（実際のメールアドレスに置き換え）
curl -X POST $CLOUD_RUN_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### フロントエンドの確認
1. `https://tanqkikuchi.github.io/tanq-quest-sns/` にアクセス
2. ログイン画面でメールアドレスを入力
3. CORSエラーが発生せず、ログインが成功することを確認

## トラブルシューティング

### エラー: "Permission denied"
→ スプレッドシートの共有設定を確認してください

### エラー: "CORS policy"
→ `ALLOWED_ORIGINS` に `https://tanqkikuchi.github.io` が含まれているか確認

### エラー: "Service account key not found"
→ `GOOGLE_SERVICE_ACCOUNT_KEY` 環境変数が正しく設定されているか確認

## 次のステップ
プロトタイプが動作したら、残りのAPI（posts, stamps, follows等）を順次実装していきます。
詳細は `README.md` を参照してください。
