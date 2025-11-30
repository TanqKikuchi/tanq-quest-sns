# データベーススキーマ定義

仕様書（spec-v0.12.md）に基づく、Googleスプレッドシートデータベースのテーブル定義です。

## 基本テーブル

### 1. Users（ユーザー）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| email | 文字列 | メールアドレス | ○ | ユニーク |
| role | 文字列 | ロール | ○ | Admin/Moderator/Student/Parent/Graduate/Staff |
| status | 文字列 | アカウント状態 | ○ | active/frozen |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |
| last_login_at | 日時 | 最終ログイン日時 | - | ISO 8601形式 |

### 2. Profiles（プロフィール）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| user_id | 文字列 | ユーザーID | ○ | Users.id参照 |
| nickname | 文字列 | ニックネーム | ○ | - |
| grade | 数値 | 学年 | ○ | - |
| class_id | 文字列 | クラスID | - | Classes.id参照 |
| school_id | 文字列 | 校舎ID | ○ | Schools.id参照 |
| greeting | 文字列 | 一言挨拶 | - | - |
| level | 数値 | レベル | ○ | デフォルト: 1 |
| completed_chapter | 数値 | 完了章 | ○ | 初回画面判定用 |

### 3. Posts（投稿）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| user_id | 文字列 | ユーザーID | ○ | Users.id参照 |
| quest_id | 文字列 | クエストID | ○ | Quests.id参照 |
| title | 文字列 | タイトル | - | 任意入力 |
| body | 文字列 | 本文 | - | 任意入力 |
| image_urls | 文字列 | 画像URL | - | カンマ区切り、最大4枚 |
| effort_score | 数値 | 頑張った度 | ○ | 1-5 |
| excitement_score | 数値 | わくわく度 | ○ | 1-5 |
| is_public | 真偽値 | 公開状態 | ○ | true/false |
| allow_promotion | 真偽値 | HP/広告掲載許諾 | - | true/false |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |
| updated_at | 日時 | 更新日時 | ○ | ISO 8601形式 |

### 4. Stamps（スタンプ）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| post_id | 文字列 | 投稿ID | ○ | Posts.id参照 |
| user_id | 文字列 | ユーザーID | ○ | Users.id参照 |
| stamp_type | 文字列 | スタンプ種別 | ○ | clap/heart/eye |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |

**制約**: 1投稿に対して1ユーザーは1つのスタンプタイプのみ（トグル方式）

### 5. Quests（クエスト）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| title | 文字列 | タイトル | ○ | - |
| description | 文字列 | 概要 | ○ | - |
| chapter | 数値 | 対象章 | ○ | - |
| week_start | 日付 | 週開始日 | ○ | YYYY-MM-DD形式 |
| week_end | 日付 | 週終了日 | ○ | YYYY-MM-DD形式 |
| type | 文字列 | クエストタイプ | - | - |
| target_grade_range | 文字列 | 対象学年範囲 | - | - |
| image_url | 文字列 | 画像URL | - | - |

### 6. Follows（フォロー）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| follower_id | 文字列 | フォローする人 | ○ | Users.id参照 |
| followee_id | 文字列 | フォローされる人 | ○ | Users.id参照 |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |

**制約**: follower_idとfollowee_idの組み合わせはユニーク（片方向フォロー）

## 追加テーブル

### 7. Reports（通報）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| post_id | 文字列 | 通報対象投稿ID | ○ | Posts.id参照 |
| reporter_id | 文字列 | 通報者ID | ○ | Users.id参照 |
| reason | 文字列 | 通報理由 | ○ | - |
| status | 文字列 | 対応ステータス | ○ | pending/reviewed/resolved |
| handled_by | 文字列 | 対応者ID | - | Users.id参照 |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |
| updated_at | 日時 | 更新日時 | ○ | ISO 8601形式 |

### 8. Schools（校舎マスタ）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| name | 文字列 | 校舎名 | ○ | - |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |

### 9. Classes（クラスマスタ）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| name | 文字列 | クラス名 | ○ | - |
| school_id | 文字列 | 校舎ID | ○ | Schools.id参照 |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |

### 10. Badges（バッジマスタ）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| id | 文字列 | 主キー | ○ | ユニーク |
| name | 文字列 | バッジ名 | ○ | - |
| description | 文字列 | 説明 | - | - |
| icon_url | 文字列 | アイコンURL | - | - |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |

### 11. UserBadges（ユーザーバッジ）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| user_id | 文字列 | ユーザーID | ○ | Users.id参照 |
| badge_id | 文字列 | バッジID | ○ | Badges.id参照 |
| earned_at | 日時 | 獲得日時 | ○ | ISO 8601形式 |

**制約**: user_idとbadge_idの組み合わせはユニーク

### 12. PostLimits（投稿制限管理）

| 列名 | 型 | 説明 | 必須 | 制約 |
|------|-----|------|------|------|
| user_id | 文字列 | ユーザーID | ○ | Users.id参照 |
| date | 日付 | 日付 | ○ | YYYY-MM-DD形式 |
| post_count | 数値 | その日の投稿数 | ○ | 1日1投稿制限用 |
| created_at | 日時 | 作成日時 | ○ | ISO 8601形式 |

**制約**: user_idとdateの組み合わせはユニーク

## データ型の詳細

### 文字列型
- 主キー: UUID v4形式を推奨
- 日時: ISO 8601形式（例: `2024-01-15T10:30:00Z`）
- 日付: YYYY-MM-DD形式（例: `2024-01-15`）
- 真偽値: `true` / `false` または `1` / `0`

### スタンプタイプの値
- `clap`: すごい！👏
- `heart`: 好き❤️
- `eye`: 衝撃！👀

### ロールの値
- `Admin`: 管理者
- `Moderator`: モデレーター
- `Student`: 受講生
- `Parent`: 保護者
- `Graduate`: 卒業生
- `Staff`: スタッフ

### ステータスの値
- `active`: アクティブ
- `frozen`: 凍結中

## 実装上の注意点

1. Googleスプレッドシートでは外部キー制約はアプリケーション層（GAS）で管理
2. 各シートの1行目はヘッダー行として使用
3. データ行は2行目から開始
4. 主キーの重複チェックはGASで実装
5. 日時の比較・ソートはISO 8601形式の文字列として扱う
6. image_urlsはカンマ区切り（例: `"url1,url2,url3"`）
7. インデックス代わりに、GASでソート・フィルタ処理を実装


