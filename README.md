# 探究学舎コミュニティSNS

仕様書（`docs/spec-v0.12.md`）に基づく、探究学舎コミュニティSNSの実装です。

## プロジェクト構成

```
/
├── backend/          # Google Apps Script (GAS) バックエンド
│   ├── main.gs      # Web Apps エントリーポイント
│   ├── utils.gs     # 共通ユーティリティ
│   ├── auth-api.gs  # 認証・ユーザー管理API
│   ├── quest-api.gs # クエスト関連API
│   ├── post-api.gs  # 投稿関連API
│   ├── stamp-api.gs # スタンプ機能API
│   ├── follow-api.gs # フォロー機能API
│   ├── profile-api.gs # プロフィール関連API
│   ├── admin-api.gs # 管理者機能API
│   └── initialize-database.gs # データベース初期化
├── frontend/        # フロントエンド（GitHub Pages用）
│   ├── index.html   # メインHTML
│   ├── js/          # JavaScriptファイル
│   ├── styles/      # CSSファイル
│   └── README.md    # フロントエンドREADME
└── docs/            # ドキュメント
    ├── spec-v0.12.md              # 仕様書
    ├── database-schema.md          # データベーススキーマ
    ├── database-setup-guide.md     # データベースセットアップガイド
    ├── api-design.md               # API設計書
    └── api-deployment-guide.md     # APIデプロイガイド
```

## 技術スタック

- **フロントエンド**: GitHub Pages (SPA)
- **バックエンド**: Google Apps Script (GAS) + Web Apps
- **データベース**: Googleスプレッドシート

## セットアップ手順

### 1. データベースの初期化

1. Googleスプレッドシートを新規作成
2. Apps Scriptエディタを開く
3. `backend/initialize-database.gs` の内容をコピー&ペースト
4. `initializeDatabase()` 関数を実行

詳細は `docs/database-setup-guide.md` を参照してください。

### 2. バックエンドAPIのデプロイ

1. データベース用スプレッドシートのApps Scriptエディタを開く
2. `backend/` ディレクトリの全ファイルを追加
3. Web Appsとしてデプロイ
4. デプロイURLを取得

詳細は `docs/api-deployment-guide.md` を参照してください。

### 3. フロントエンドの設定

1. `frontend/js/main.js` でAPIベースURLを設定
2. GitHub Pagesにデプロイ

詳細は `frontend/README.md` を参照してください。

## 実装済み機能

### バックエンド

- ✅ 認証・ユーザー管理（ログイン、ユーザー作成）
- ✅ クエスト取得（今週のクエスト、過去のクエスト）
- ✅ 投稿機能（作成、編集、削除、一覧、フィルタ・ソート）
- ✅ スタンプ機能（👏/❤️/👀、トグル方式）
- ✅ フォロー機能（追加、削除、一覧）
- ✅ プロフィール管理（取得、更新）
- ✅ 管理者機能（投稿管理、アカウント凍結、通報、メトリクス）
- ✅ 1日1投稿制限
- ✅ 権限管理（Admin/Moderator/一般ユーザー）

### フロントエンド

- ✅ ログイン/ログアウト
- ✅ 初回画面（章受講確認）
- ✅ クエストポータル（今週のクエスト表示、投稿タイムライン）
- ✅ コミュニティタイムライン（フィルタ、ソート、スタンプ機能）
- ✅ 投稿作成（画像選択、確認画面）
- ✅ マイページ（プロフィール表示、投稿一覧、編集・削除）

## 実装済み機能（追加）

- ✅ 画像アップロード機能（Google Drive API使用）
  - 個人Driveと共有Drive（Shared Drive）の両方に対応
  - 詳細は [画像アップロードセットアップガイド](docs/image-upload-setup.md) を参照

## 実装済み機能（最新）

- ✅ フォロー機能のUI（フォローボタン、フォロー一覧）
- ✅ エラーハンドリングの強化（統一的なエラー表示）
- ✅ ローディング表示（共通UIコンポーネント）
- ✅ 通知システム（成功/エラーメッセージ）
- ✅ レスポンシブデザイン（PC/タブレット/スマホ対応）
- ✅ 投稿編集機能

## 実装済み機能（最終）

- ✅ 管理者機能のUI（ダッシュボード、投稿管理、通報管理、ユーザー管理）
- ✅ 通報機能（投稿からの通報ボタン）

## 未実装機能（プロトタイプ後）

- なし（プロトタイプに必要な機能はすべて実装済み）

## ドキュメント

- [仕様書](docs/spec-v0.12.md)
- [データベーススキーマ](docs/database-schema.md)
- [データベースセットアップガイド](docs/database-setup-guide.md)
- [API設計書](docs/api-design.md)
- [APIデプロイガイド](docs/api-deployment-guide.md)
- [画像アップロードセットアップガイド](docs/image-upload-setup.md)
- [Google Drive設定ガイド](docs/drive-setup-guide.md)（個人Drive / 共有Drive）
- [クイックスタートガイド](docs/quick-start-guide.md)
- [プロトタイプローンチチェックリスト](docs/prototype-launch-checklist.md)
- [実装サマリー](docs/implementation-summary.md)
- [フロントエンドREADME](frontend/README.md)

## 開発

### ローカル開発

1. フロントエンド: ローカルサーバーを起動
2. バックエンド: GASエディタで直接編集・テスト

### 注意事項

- CORSの問題が発生する可能性があります
- GAS Web AppsのデプロイURLが必要です
- 画像アップロード機能は実装が必要です
- 認証は簡易実装（本番環境では強化が必要）

## ライセンス

（ライセンス情報を追加）

