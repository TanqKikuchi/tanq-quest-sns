# 画像アップロード機能セットアップガイド

Google Drive APIを使用した画像アップロード機能のセットアップ方法です。

## 前提条件

- Googleアカウント
- Google Apps Scriptプロジェクト
- Google Driveへのアクセス権限

## セットアップ手順

### 1. Google Drive APIの有効化

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. プロジェクトを選択（または新規作成）
3. 「APIとサービス」>「ライブラリ」を開く
4. "Google Drive API" を検索して有効化

### 2. Apps Scriptプロジェクトの設定

1. Apps Scriptエディタを開く
2. 「プロジェクトの設定」（歯車アイコン）を開く
3. 「Google Cloud Platform (GCP) プロジェクト」で、上記で作成したプロジェクトを選択

### 3. 画像フォルダの設定

#### オプション1: 自動作成（個人Drive）

初回実行時に自動的に実行ユーザーの個人Driveに `SNS投稿画像` というフォルダが作成されます。

#### オプション2: 手動設定（個人Driveまたは共有Drive）

**個人Driveの場合：**

1. Google Driveで画像保存用のフォルダを作成
2. フォルダを開いて、URLからフォルダIDを取得
   - URL例: `https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j`
   - フォルダID: `1a2b3c4d5e6f7g8h9i0j`
3. Apps Scriptエディタで「プロジェクトの設定」>「スクリプト プロパティ」を開く
4. プロパティを追加：
   - プロパティ名: `IMAGE_FOLDER_ID`
   - プロパティ値: フォルダID

**共有Drive（Shared Drive）の場合：**

1. Google Workspaceの共有Driveで画像保存用のフォルダを作成
2. フォルダを開いて、URLからフォルダIDを取得
3. Apps Scriptエディタで「プロジェクトの設定」>「スクリプト プロパティ」を開く
4. プロパティを追加：
   - プロパティ名: `IMAGE_FOLDER_ID`
   - プロパティ値: 共有DriveのフォルダID

**重要：** 共有Driveを使用する場合、実行ユーザーがその共有Driveへのアクセス権限を持っている必要があります。

### 4. 権限の承認

初回実行時に以下の権限の承認が必要です：

- Google Driveへのアクセス
- ファイルの作成・編集

**共有Driveを使用する場合：**
- 実行ユーザーが共有Driveへのアクセス権限を持っている必要があります
- 共有Driveの管理者に、実行ユーザーに適切な権限（編集者以上）を付与してもらってください

## 使用方法

### フロントエンドから画像をアップロード

```javascript
// 複数画像をアップロード
const response = await apiClient.post('api/images/upload-multiple', {
  images: [
    {
      data: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...', // Base64エンコードされた画像
      filename: 'image1.jpg',
      mime_type: 'image/jpeg'
    }
  ]
});

const imageUrls = response.image_urls; // アップロードされた画像のURL配列
```

### APIエンドポイント

#### POST /api/images/upload-multiple

複数画像を一括アップロード

**リクエスト:**
```json
{
  "images": [
    {
      "data": "data:image/jpeg;base64,...",
      "filename": "image1.jpg",
      "mime_type": "image/jpeg"
    }
  ]
}
```

**レスポンス:**
```json
{
  "success": true,
  "image_urls": [
    "https://drive.google.com/uc?export=view&id=FILE_ID_1",
    "https://drive.google.com/uc?export=view&id=FILE_ID_2"
  ]
}
```

#### POST /api/images/upload

単一画像をアップロード

**リクエスト:**
```json
{
  "image_data": "data:image/jpeg;base64,...",
  "filename": "image.jpg"
}
```

#### DELETE /api/images/:file_id

画像を削除（管理者・モデレーターのみ）

## 画像URLの形式

アップロードされた画像は以下の形式のURLでアクセス可能です：

```
https://drive.google.com/uc?export=view&id={FILE_ID}
```

このURLは誰でもアクセス可能（`ANYONE_WITH_LINK`）に設定されています。

## 個人Driveと共有Driveの違い

### 個人Drive

- **メリット**: セットアップが簡単、自動でフォルダ作成
- **デメリット**: 個人アカウントの容量制限に依存、アカウント削除のリスク
- **用途**: プロトタイプ、小規模運用

### 共有Drive（Shared Drive）

- **メリット**: 会社全体で容量を共有、アカウント削除の影響を受けにくい、管理が容易
- **デメリット**: 手動でフォルダIDを設定する必要がある
- **用途**: 本格運用、チーム運用

## 注意事項

### ストレージ制限

- **個人Drive**: 通常15GB（Workspaceでも容量に上限あり）
- **共有Drive**: Workspaceプランに応じた容量（例: Business Standardで2TB/ユーザー）
- 大量の画像をアップロードする場合は、ストレージ管理が必要

### セキュリティ

- 現在の実装では、アップロードされた画像は誰でもアクセス可能（`ANYONE_WITH_LINK`）に設定されています
- より厳格なアクセス制御が必要な場合は、実装を変更してください
- 共有Driveを使用する場合、フォルダの共有設定も確認してください

### パフォーマンス

- 大きな画像ファイルのアップロードには時間がかかる可能性があります
- フロントエンド側で画像のリサイズを検討してください
- 共有Driveは個人Driveと比較して若干遅い場合があります

### 共有Drive使用時の注意点

1. **実行ユーザーの権限**: 実行ユーザーが共有Driveのフォルダにアクセスできる必要があります
2. **フォルダIDの取得**: 共有DriveのフォルダIDは、フォルダを開いた時のURLから取得できます
3. **容量管理**: 共有Driveの容量は組織全体で管理されるため、容量使用状況を定期的に確認してください

## トラブルシューティング

### エラー: "Drive API is not enabled"

- Google Cloud ConsoleでDrive APIが有効化されているか確認
- Apps Scriptプロジェクトが正しいGCPプロジェクトに紐づいているか確認

### エラー: "Permission denied"

- 初回実行時に権限の承認が必要です
- Apps Scriptの実行ログを確認してください

### 画像が表示されない

- ファイルの共有設定が正しいか確認
- URLの形式が正しいか確認
- ブラウザのキャッシュをクリア

## 今後の改善案

1. **画像リサイズ**: アップロード前に自動リサイズ
2. **画像最適化**: ファイルサイズの圧縮
3. **サムネイル生成**: サムネイル画像の自動生成
4. **アクセス制御**: より細かい権限管理
5. **ストレージ管理**: 古い画像の自動削除

