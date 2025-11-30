# データベースセットアップガイド

このガイドでは、Googleスプレッドシートを使用したデータベースの初期設定方法を説明します。

## 前提条件

- Googleアカウント
- Googleスプレッドシートへのアクセス権限
- Google Apps Script (GAS) へのアクセス権限

## セットアップ手順

### 1. スプレッドシートの作成

1. Googleドライブにアクセス
2. 「新規」>「Googleスプレッドシート」を選択
3. スプレッドシートに適切な名前を付ける（例: `探究学舎SNS_DB`）

### 2. Apps Scriptの設定

1. スプレッドシートのメニューから「拡張機能」>「Apps Script」を選択
2. 新しいエディタが開きます
3. `Code.gs` ファイルの内容を削除
4. `backend/initialize-database.gs` の内容をコピー&ペースト

### 3. データベースの初期化

1. Apps Scriptエディタで `initializeDatabase` 関数を選択
2. 「実行」ボタンをクリック
3. 初回実行時は認証が必要です：
   - 「承認が必要です」ダイアログが表示されたら「承認」をクリック
   - Googleアカウントを選択
   - 「詳細」>「[プロジェクト名]（安全ではないページ）に移動」をクリック
   - 「許可」をクリック
4. 実行が完了すると、スプレッドシートに以下の12個のシートが作成されます：
   - Users
   - Profiles
   - Posts
   - Stamps
   - Quests
   - Follows
   - Reports
   - Schools
   - Classes
   - Badges
   - UserBadges
   - PostLimits

### 4. 確認

各シートに以下の要素が正しく設定されているか確認してください：

- ヘッダー行（1行目）が太字で設定されている
- 1行目が固定されている（`setFrozenRows(1)`）
- 各列の幅が適切に設定されている
- すべての列が正しく定義されている

## テーブル構造の確認

各テーブルの詳細な構造は `docs/database-schema.md` を参照してください。

## トラブルシューティング

### シートが作成されない

- Apps Scriptの実行ログを確認（「表示」>「ログ」）
- エラーメッセージを確認し、必要に応じて修正

### 権限エラーが発生する

- Googleアカウントにスプレッドシートの編集権限があるか確認
- Apps Scriptの実行権限が正しく付与されているか確認

### 既存のシートを保持したい

`initializeDatabase()` 関数内の以下のコメントアウト部分を有効にすると、既存のシートを削除せずに新しいシートのみを作成します：

```javascript
// 既存のシートを削除（オプション: 初期化時のみ）
// const sheets = spreadsheet.getSheets();
// sheets.forEach(sheet => {
//   if (sheet.getName() !== 'README') {
//     spreadsheet.deleteSheet(sheet);
//   }
// });
```

## 次のステップ

データベースの初期化が完了したら：

1. マスターデータの投入（Schools、Classes、Badges、Questsなど）
2. テストユーザーの作成（Users、Profiles）
3. GAS APIの実装（`backend/` ディレクトリに実装予定）

## 注意事項

- 本番環境では、スプレッドシートへのアクセス権限を適切に管理してください
- 定期的なバックアップを推奨します
- 大量のデータが蓄積される場合は、パフォーマンスに注意してください


