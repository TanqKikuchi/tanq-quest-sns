# クイックスタートガイド

プロトタイプローンチまでの最短手順です。

## 前提条件

- Googleアカウント（Workspace推奨）
- GitHubアカウント（フロントエンドデプロイ用）

## ステップ1: データベースの初期化（約10分）

1. **Googleスプレッドシートを作成**
   - Google Driveで新規スプレッドシートを作成
   - 名前を付ける（例: `探究学舎SNS_DB`）

2. **Apps Scriptを開く**
   - スプレッドシートの「拡張機能」>「Apps Script」を選択

3. **初期化スクリプトを実行**
   - `backend/initialize-database.gs` の内容をコピー&ペースト
   - `initializeDatabase()` 関数を選択して実行
   - 権限を承認

4. **マスターデータを投入**
   - Schoolsシートに校舎データを追加
   - Classesシートにクラスデータを追加
   - Questsシートにクエストデータを追加

## ステップ2: バックエンドAPIのデプロイ（約15分）

1. **バックエンドファイルを追加**
   - Apps Scriptエディタで以下のファイルを追加：
     - `utils.gs`
     - `auth-api.gs`
     - `quest-api.gs`
     - `post-api.gs`
     - `stamp-api.gs`
     - `follow-api.gs`
     - `profile-api.gs`
     - `admin-api.gs`
     - `image-api.gs`
     - `main.gs`

2. **Google Drive APIを有効化**
   - [Google Cloud Console](https://console.cloud.google.com/) にアクセス
   - プロジェクトを選択（または新規作成）
   - 「APIとサービス」>「ライブラリ」で「Google Drive API」を有効化
   - Apps Scriptの「プロジェクトの設定」でGCPプロジェクトを選択

3. **画像フォルダの設定**
   - Google Driveで画像保存用フォルダを作成（個人Driveまたは共有Drive）
   - フォルダIDを取得（URLから）
   - Apps Scriptの「スクリプト プロパティ」に追加：
     - プロパティ名: `IMAGE_FOLDER_ID`
     - プロパティ値: フォルダID

4. **Web Appsとしてデプロイ**
   - 「デプロイ」>「新しいデプロイ」>「ウェブアプリ」を選択
   - 設定：
     - 実行ユーザー: 「自分」
     - アクセスできるユーザー: 「全員」（または「自分」）
   - デプロイURLをコピー

## ステップ3: フロントエンドの設定（約10分）

1. **APIベースURLを設定**
   - `frontend/js/main.js` を開く
   - デプロイURLを設定：
   ```javascript
   apiClient.baseUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```

2. **GitHub Pagesにデプロイ**
   - GitHubリポジトリを作成
   - `frontend/` ディレクトリの内容をリポジトリのルートに配置
   - リポジトリの「Settings」>「Pages」でGitHub Pagesを有効化
   - ソースを「main」ブランチ、「/root」に設定

## ステップ4: テストデータの投入（約5分）

1. **テストユーザーの作成**
   - スプレッドシートのUsersシートにユーザーを追加
   - Profilesシートに対応するプロフィールを追加

2. **サンプル投稿の作成（オプション）**
   - アプリから投稿を作成してテスト

## ステップ5: 動作確認（約10分）

1. **基本機能の確認**
   - ログイン
   - クエストポータルの表示
   - 投稿作成
   - スタンプ機能
   - フォロー機能

2. **エラーの確認**
   - ブラウザのコンソールを確認
   - Apps Scriptの実行ログを確認

## トラブルシューティング

### APIが動作しない
- デプロイURLが正しいか確認
- 実行ユーザーの権限を確認
- Apps Scriptの実行ログを確認

### 画像がアップロードされない
- Drive APIが有効化されているか確認
- フォルダIDが正しいか確認
- 実行ユーザーのDrive権限を確認

### CORSエラー
- GAS Web Appsの設定を確認
- フロントエンドのURLが正しいか確認

## 次のステップ

詳細な手順は以下を参照：
- [データベースセットアップガイド](database-setup-guide.md)
- [APIデプロイガイド](api-deployment-guide.md)
- [画像アップロードセットアップガイド](image-upload-setup.md)
- [プロトタイプローンチチェックリスト](prototype-launch-checklist.md)

