# フロントエンド実装

探究学舎コミュニティSNSのフロントエンド実装です。

## 構成

- `index.html`: メインHTMLファイル
- `styles/main.css`: スタイルシート
- `js/`: JavaScriptファイル
  - `api-client.js`: APIクライアント
  - `router.js`: ルーティング
  - `auth.js`: 認証管理
  - `quest.js`: クエストポータル
  - `community.js`: コミュニティタイムライン
  - `post.js`: 投稿機能
  - `profile.js`: マイページ
  - `main.js`: メインスクリプト

## セットアップ

### 1. APIベースURLの設定

`js/main.js` でAPIベースURLを設定してください：

```javascript
apiClient.baseUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

### 2. GitHub Pagesへのデプロイ

1. GitHubリポジトリを作成
2. `frontend/` ディレクトリの内容をリポジトリのルートに配置
3. GitHub Pagesを有効化
4. 設定でソースを選択（mainブランチ、/root）

## 機能

### 実装済み機能

- ログイン/ログアウト
- 初回画面（章受講確認）
- クエストポータル（今週のクエスト表示、投稿タイムライン）
- コミュニティタイムライン（フィルタ、ソート、スタンプ機能）
- 投稿作成（画像アップロード、確認画面）
- マイページ（プロフィール表示、投稿一覧、編集・削除）

### 未実装機能（要実装）

- 画像アップロード機能（現在は仮実装）
  - Google Drive APIまたはCloud Storageを使用
- フォロー機能のUI
- 管理者機能のUI
- エラーハンドリングの強化
- ローディング表示
- レスポンシブデザインの調整

## 開発

### ローカル開発

1. ローカルサーバーを起動（例: `python -m http.server 8000`）
2. ブラウザで `http://localhost:8000` にアクセス

### 注意事項

- CORSの問題が発生する可能性があります
- GAS Web AppsのデプロイURLが必要です
- 画像アップロード機能は実装が必要です

