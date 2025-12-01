import { createHttpError } from '../utils/httpError.js'

/**
 * 認証ミドルウェア（簡易版）
 * クエリパラメータまたはヘッダーからuser_idを取得
 * 本番環境ではJWTトークンなど適切な認証を実装する必要があります
 */
export function requireAuth (req, res, next) {
  // クエリパラメータからuser_idを取得（GAS互換性のため）
  const userId = req.query.user_id || req.headers['x-user-id']
  
  if (!userId) {
    return next(createHttpError(401, 'UNAUTHORIZED', 'Authentication required'))
  }
  
  // リクエストオブジェクトにユーザー情報を追加
  req.user = { id: userId }
  next()
}

