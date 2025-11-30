# APIデプロイガイド

このガイドでは、Google Apps Script (GAS) で実装したAPIをWeb Appsとしてデプロイする方法を説明します。

## 前提条件

- Googleアカウント
- Googleスプレッドシート（データベース）が既に初期化されていること
- Apps Scriptエディタへのアクセス権限

## デプロイ手順

### 1. スプレッドシートにApps Scriptを追加

1. データベース用のスプレッドシートを開く
2. 「拡張機能」>「Apps Script」を選択
3. エディタが開きます

### 2. スクリプトファイルを追加

以下のファイルを順番に追加します（各ファイルを新規作成）：

1. `utils.gs` - 共通ユーティリティ関数
2. `auth-api.gs` - 認証・ユーザー管理API
3. `quest-api.gs` - クエスト関連API
4. `post-api.gs` - 投稿関連API
5. `stamp-api.gs` - スタンプ機能API
6. `follow-api.gs` - フォロー機能API
7. `profile-api.gs` - プロフィール関連API
8. `admin-api.gs` - 管理者機能API
9. `main.gs` - Web Appsエントリーポイント

**重要**: 各ファイルの内容を `backend/` ディレクトリからコピー&ペーストしてください。

### 3. スプレッドシートIDの設定（オプション）

複数のスプレッドシートを使用する場合、スクリプトプロパティにスプレッドシートIDを設定します：

1. Apps Scriptエディタで「プロジェクトの設定」を開く
2. 「スクリプト プロパティ」セクションで「スクリプト プロパティを追加」をクリック
3. プロパティ名: `SPREADSHEET_ID`
4. プロパティ値: スプレッドシートID（URLから取得可能）

### 4. Web Appsとしてデプロイ

1. Apps Scriptエディタで「デプロイ」>「新しいデプロイ」を選択
2. 種類の選択で「ウェブアプリ」を選択
3. 設定を入力：
   - **説明**: 任意（例: "SNS API v1.0"）
   - **次のユーザーとして実行**: 「自分」
   - **アクセスできるユーザー**: 
     - 開発中: 「自分」
     - 本番: 「全員」（認証はAPI側で実装）
4. 「デプロイ」をクリック
5. デプロイURLが表示されます（例: `https://script.google.com/macros/s/.../exec`）

### 5. デプロイURLの確認

デプロイURLは以下の形式になります：
```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

このURLがAPIのベースURLになります。

## APIエンドポイントの使用方法

### エンドポイント形式

```
{ベースURL}?path=api/{リソース}/{アクション}
```

### 例

#### GET リクエスト
```
https://script.google.com/macros/s/.../exec?path=api/quests/current
```

#### POST リクエスト
```
POST https://script.google.com/macros/s/.../exec?path=api/posts
Content-Type: application/json

{
  "quest_id": "...",
  "title": "...",
  ...
}
```

#### PUT/DELETE/PATCH リクエスト

GASでは標準でPUT/DELETE/PATCHをサポートしていないため、以下のいずれかの方法を使用：

**方法1: _method パラメータを使用**
```
POST https://script.google.com/macros/s/.../exec?path=api/posts/{id}&_method=PUT
```

**方法2: パスで判定（実装済み）**
```
POST https://script.google.com/macros/s/.../exec?path=api/posts/{id}
```
（main.gsでパスとメソッドの組み合わせで判定）

## 認証の実装

現在の実装では、簡易的な認証としてリクエストヘッダー `X-User-Id` を使用しています。

### 本番環境での推奨実装

1. **セッション管理**: GASのCacheServiceまたは外部ストレージを使用
2. **JWTトークン**: トークンベース認証を実装
3. **OAuth 2.0**: Google OAuthを使用

### 現在の実装での使用方法

```javascript
// フロントエンドからのリクエスト例
fetch('https://script.google.com/macros/s/.../exec?path=api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'user-id-here'
  },
  body: JSON.stringify({
    quest_id: '...',
    title: '...'
  })
})
```

## エラーハンドリング

すべてのAPIは以下の形式でエラーを返します：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### 主なエラーコード

- `UNAUTHORIZED`: 認証が必要
- `FORBIDDEN`: 権限不足
- `NOT_FOUND`: リソースが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `DUPLICATE_ERROR`: 重複エラー
- `LIMIT_EXCEEDED`: 制限超過
- `INVALID_REQUEST`: 不正なリクエスト
- `SERVER_ERROR`: サーバーエラー

## テスト方法

### 1. Apps Scriptエディタで直接テスト

各関数を選択して「実行」ボタンでテストできます（ただし、リクエストオブジェクトを手動で作成する必要があります）。

### 2. Postmanやcurlでテスト

```bash
# 今週のクエスト取得
curl "https://script.google.com/macros/s/.../exec?path=api/quests/current"

# 投稿作成
curl -X POST "https://script.google.com/macros/s/.../exec?path=api/posts" \
  -H "Content-Type: application/json" \
  -H "X-User-Id: user-id" \
  -d '{"quest_id":"...","effort_score":5,"excitement_score":4}'
```

## パフォーマンス考慮事項

1. **大量データ**: ページネーションを使用（limit/offsetパラメータ）
2. **キャッシュ**: GASのCacheServiceを使用して頻繁にアクセスするデータをキャッシュ
3. **バッチ処理**: 可能な限りバッチでデータを取得

## セキュリティ考慮事項

1. **アクセス制御**: Web Appsのアクセス権限を適切に設定
2. **認証**: 本番環境では適切な認証メカニズムを実装
3. **入力検証**: すべての入力データを検証
4. **エラーメッセージ**: 機密情報を含むエラーメッセージを返さない

## トラブルシューティング

### エラー: "Sheet not found"
- スプレッドシートが正しく初期化されているか確認
- スクリプトプロパティの `SPREADSHEET_ID` が正しく設定されているか確認

### エラー: "UNAUTHORIZED"
- リクエストヘッダーに `X-User-Id` が含まれているか確認
- ユーザーが存在し、アクティブか確認

### パフォーマンスが遅い
- 大量のデータを取得する場合はページネーションを使用
- 不要なデータ取得を避ける

## 次のステップ

1. フロントエンド実装（GitHub Pages）
2. 認証システムの強化
3. 画像アップロード機能の実装（Google Drive API使用）
4. メトリクスダッシュボードの実装

