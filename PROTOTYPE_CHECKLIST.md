# プロトタイプ完成チェックリスト

## 前提条件
- [ ] GCPアカウントがある
- [ ] `gcloud` CLIがインストール済み
- [ ] Googleスプレッドシートが作成済み（データベース初期化済み）

## Cloud Runバックエンドのデプロイ

### ステップ1: GCPプロジェクトの準備
- [ ] GCPプロジェクトを作成（または既存プロジェクトを使用）
- [ ] プロジェクトIDを確認
- [ ] 必要なAPIを有効化（Cloud Run, Cloud Build, Sheets API, Drive API）

### ステップ2: サービスアカウントの作成
- [ ] サービスアカウントを作成
- [ ] サービスアカウントのメールアドレスを確認
- [ ] スプレッドシートにサービスアカウントを「編集者」として共有
- [ ] Driveフォルダにもサービスアカウントを共有（画像アップロード用）

### ステップ3: Cloud Runへのデプロイ
- [ ] `cloud-run-backend/QUICKSTART.md` の手順に従ってデプロイ
- [ ] デプロイURLを取得
- [ ] ヘルスチェックが成功することを確認: `curl https://your-url/health`

### ステップ4: フロントエンドの設定
- [ ] `frontend/js/config.js` を開く
- [ ] Cloud Run URLを `API_BASE_URL` に設定
- [ ] GitHubにコミット＆プッシュ
- [ ] GitHub Pagesが更新されるまで待つ（数分）

## 動作確認

### バックエンド
- [ ] `/health` エンドポイントが200を返す
- [ ] `/api/auth/login` が動作する（curlでテスト）
- [ ] Cloud Runのログでエラーがないことを確認

### フロントエンド
- [ ] `https://tanqkikuchi.github.io/tanq-quest-sns/` にアクセス
- [ ] ログイン画面が表示される
- [ ] メールアドレスを入力してログイン
- [ ] CORSエラーが発生しない
- [ ] ログインが成功する

## トラブルシューティング

### CORSエラーが発生する場合
- `ALLOWED_ORIGINS` 環境変数に `https://tanqkikuchi.github.io` が含まれているか確認
- Cloud Runのログを確認: `gcloud logging read "resource.type=cloud_run_revision" --limit=50`

### ログインが失敗する場合
- スプレッドシートにユーザーデータが存在するか確認
- サービスアカウントにスプレッドシートへのアクセス権限があるか確認
- Cloud Runのログでエラー内容を確認

### デプロイが失敗する場合
- Dockerfileの構文を確認
- 環境変数が正しく設定されているか確認
- `gcloud builds log` でビルドログを確認

## 次のステップ
プロトタイプが動作したら：
1. 残りのAPI（posts, stamps, follows等）を実装
2. エラーハンドリングとロギングを強化
3. テストを追加
4. モニタリングとアラートを設定

詳細は `cloud-run-backend/README.md` を参照してください。
