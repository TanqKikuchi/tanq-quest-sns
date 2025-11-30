# API設計書

仕様書（spec-v0.12.md）に基づく、Google Apps Script (GAS) + Web Apps APIの設計書です。

## 基本仕様

- **ベースURL**: GAS Web AppsのデプロイURL
- **認証方式**: セッション管理（Cookie）またはトークンベース
- **リクエスト形式**: JSON
- **レスポンス形式**: JSON
- **エラーハンドリング**: HTTPステータスコード + エラーメッセージ

## エンドポイント一覧

### 認証・ユーザー管理

#### POST /api/auth/login
ユーザーログイン

**リクエスト:**
```json
{
  "email": "user@example.com"
}
```

**レスポンス:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "Student",
    "status": "active"
  },
  "profile": {
    "user_id": "user-id",
    "nickname": "ニックネーム",
    "grade": 5,
    "school_id": "school-id",
    "level": 1,
    "completed_chapter": 1
  }
}
```

#### POST /api/auth/logout
ユーザーログアウト

#### GET /api/auth/me
現在のユーザー情報取得

#### POST /api/users
ユーザー作成（初回登録）

**リクエスト:**
```json
{
  "email": "user@example.com",
  "role": "Student",
  "profile": {
    "nickname": "ニックネーム",
    "grade": 5,
    "school_id": "school-id",
    "completed_chapter": 1
  }
}
```

### クエスト関連

#### GET /api/quests/current
今週のクエスト取得

**レスポンス:**
```json
{
  "success": true,
  "quest": {
    "id": "quest-id",
    "title": "今週のクエスト",
    "description": "概要",
    "chapter": 1,
    "week_start": "2024-01-15",
    "week_end": "2024-01-21",
    "image_url": "https://..."
  }
}
```

#### GET /api/quests
過去のクエスト一覧取得

**クエリパラメータ:**
- `chapter` (optional): 章でフィルタ
- `limit` (optional): 取得件数
- `offset` (optional): オフセット

#### GET /api/quests/:id
クエスト詳細取得

### 投稿関連

#### GET /api/posts
投稿一覧取得（コミュニティタイムライン）

**クエリパラメータ:**
- `filter` (optional): フィルタタイプ（all/school/class/grade/follow/level）
- `filter_value` (optional): フィルタ値（school_id, class_id, grade, level）
- `sort` (optional): ソート（newest/clap/heart/eye）
- `limit` (optional): 取得件数（デフォルト: 20）
- `offset` (optional): オフセット

**レスポンス:**
```json
{
  "success": true,
  "posts": [
    {
      "id": "post-id",
      "user_id": "user-id",
      "user": {
        "nickname": "ニックネーム",
        "grade": 5,
        "school": "校舎名",
        "level": 1
      },
      "quest": {
        "id": "quest-id",
        "title": "クエストタイトル"
      },
      "title": "投稿タイトル",
      "body": "本文",
      "image_urls": ["url1", "url2"],
      "effort_score": 5,
      "excitement_score": 4,
      "is_public": true,
      "stamps": {
        "clap": 10,
        "heart": 5,
        "eye": 3,
        "total": 18
      },
      "my_stamp": "clap", // 現在のユーザーが押したスタンプ
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100
}
```

#### GET /api/posts/quest/:quest_id
特定クエストの投稿一覧取得（クエストポータル用）

#### GET /api/posts/:id
投稿詳細取得

#### POST /api/posts
投稿作成

**リクエスト:**
```json
{
  "quest_id": "quest-id",
  "title": "投稿タイトル",
  "body": "本文",
  "image_urls": ["url1", "url2"],
  "effort_score": 5,
  "excitement_score": 4,
  "allow_promotion": false
}
```

**バリデーション:**
- 1日1投稿制限チェック
- effort_score, excitement_score: 1-5の範囲

**レスポンス:**
```json
{
  "success": true,
  "post": {
    "id": "post-id",
    ...
  }
}
```

#### PUT /api/posts/:id
投稿編集

**リクエスト:** POST /api/posts と同じ

**権限チェック:** 自分の投稿のみ編集可能

#### DELETE /api/posts/:id
投稿削除

**権限チェック:** 
- 自分の投稿: 削除可能
- 管理者・モデレーター: 他人の投稿も削除可能

#### PATCH /api/posts/:id/visibility
投稿の公開/非公開切替

**リクエスト:**
```json
{
  "is_public": false
}
```

#### GET /api/posts/my
自分の投稿一覧取得（マイページ用）

### スタンプ関連

#### POST /api/posts/:id/stamps
スタンプを押す/取り消す（トグル）

**リクエスト:**
```json
{
  "stamp_type": "clap" // clap/heart/eye
}
```

**動作:**
- 既に同じスタンプを押している場合: 削除
- 別のスタンプを押している場合: 既存を削除して新しいスタンプを追加
- スタンプを押していない場合: 追加

**レスポンス:**
```json
{
  "success": true,
  "action": "added", // added/removed
  "stamps": {
    "clap": 10,
    "heart": 5,
    "eye": 3,
    "total": 18
  }
}
```

#### GET /api/posts/:id/stamps
投稿のスタンプ情報取得

### フォロー関連

#### POST /api/follows
フォロー追加

**リクエスト:**
```json
{
  "followee_id": "user-id"
}
```

#### DELETE /api/follows/:followee_id
フォロー解除

#### GET /api/follows
フォロー一覧取得

**クエリパラメータ:**
- `user_id` (optional): 指定ユーザーのフォロー一覧（デフォルト: 現在のユーザー）

**レスポンス:**
```json
{
  "success": true,
  "follows": [
    {
      "followee_id": "user-id",
      "followee": {
        "nickname": "ニックネーム",
        "grade": 5,
        "school": "校舎名",
        "level": 1
      },
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "count": 10
}
```

### プロフィール関連

#### GET /api/profiles/:user_id
プロフィール取得

**レスポンス:**
```json
{
  "success": true,
  "profile": {
    "user_id": "user-id",
    "nickname": "ニックネーム",
    "grade": 5,
    "class": {
      "id": "class-id",
      "name": "クラス名"
    },
    "school": {
      "id": "school-id",
      "name": "校舎名"
    },
    "greeting": "一言挨拶",
    "level": 5,
    "completed_chapter": 3,
    "post_count": 20,
    "total_stamps": 150,
    "badges": [
      {
        "id": "badge-id",
        "name": "バッジ名",
        "icon_url": "https://..."
      }
    ],
    "follow_count": 10
  }
}
```

#### PUT /api/profiles/me
自分のプロフィール更新

**リクエスト:**
```json
{
  "nickname": "新しいニックネーム",
  "greeting": "新しい挨拶",
  "grade": 6,
  "class_id": "class-id"
}
```

### 管理者機能

#### GET /api/admin/posts
投稿管理一覧（管理者・モデレーター用）

**クエリパラメータ:**
- `search` (optional): 検索キーワード
- `status` (optional): 公開状態フィルタ
- `limit`, `offset`: ページネーション

#### PATCH /api/admin/posts/:id/force-hide
投稿を強制非公開（管理者・モデレーター用）

#### GET /api/admin/users
ユーザー一覧取得（管理者用）

#### PATCH /api/admin/users/:id/status
アカウント状態変更（凍結/解除）

**リクエスト:**
```json
{
  "status": "frozen" // active/frozen
}
```

#### GET /api/admin/reports
通報一覧取得（管理者・モデレーター用）

**クエリパラメータ:**
- `status` (optional): ステータスフィルタ（pending/reviewed/resolved）

#### POST /api/admin/reports
通報作成

**リクエスト:**
```json
{
  "post_id": "post-id",
  "reason": "通報理由"
}
```

#### PATCH /api/admin/reports/:id
通報対応ステータス更新

**リクエスト:**
```json
{
  "status": "reviewed", // pending/reviewed/resolved
  "handled_by": "user-id"
}
```

#### GET /api/admin/metrics
メトリクス取得（管理者・モデレーター用）

**クエリパラメータ:**
- `week_start` (optional): 週開始日（YYYY-MM-DD）
- `week_end` (optional): 週終了日（YYYY-MM-DD）

**レスポンス:**
```json
{
  "success": true,
  "metrics": {
    "unique_posters": 50,
    "active_users": 100,
    "post_count": 200,
    "total_stamps": 500,
    "avg_effort_score": 4.2,
    "avg_excitement_score": 4.5,
    "distribution": {
      "by_school": {
        "school-id-1": 30,
        "school-id-2": 20
      },
      "by_grade": {
        "1": 10,
        "2": 15,
        "3": 25
      }
    }
  }
}
```

## エラーレスポンス

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ"
  }
}
```

### エラーコード一覧

- `UNAUTHORIZED`: 認証が必要
- `FORBIDDEN`: 権限不足
- `NOT_FOUND`: リソースが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `DUPLICATE_ERROR`: 重複エラー
- `LIMIT_EXCEEDED`: 制限超過（例: 1日1投稿制限）
- `INVALID_REQUEST`: 不正なリクエスト
- `SERVER_ERROR`: サーバーエラー

## 認証・権限チェック

### ロール定義
- `Admin`: 全権限
- `Moderator`: 投稿管理、通報対応、メトリクス閲覧
- `Student/Parent/Graduate/Staff`: 一般ユーザー権限

### 権限チェックが必要なエンドポイント

- 投稿削除（他人）: Admin, Moderator
- アカウント凍結: Admin
- 通報確認/対応: Admin, Moderator
- メトリクス閲覧: Admin, Moderator
- 校舎別フィルタ切替: 運営/MFのみ

## データアクセスパターン

### スプレッドシートアクセス
- 各テーブルは独立したシートとして管理
- 1行目はヘッダー行
- データは2行目から開始
- 主キー検索は全行スキャン（GASの制約）

### パフォーマンス考慮
- 大量データの場合はページネーション必須
- フィルタ・ソートはGAS側で実装
- キャッシュは使用しない（リアルタイム性重視）

