import { Router } from 'express'
import { getFollows, createFollow, deleteFollow } from '../services/followService.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// すべてのルートで認証が必要
router.use(requireAuth)

// GET /api/follows - フォロー一覧取得
router.get('/', async (req, res, next) => {
  try {
    const userId = req.query.user_id || req.user.id
    const result = await getFollows(userId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

// POST /api/follows - フォロー追加
router.post('/', async (req, res, next) => {
  try {
    const followerId = req.user.id
    const { followee_id: followeeId } = req.body
    
    if (!followeeId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'followee_id is required' }
      })
    }
    
    const result = await createFollow(followerId, followeeId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

// DELETE /api/follows/:followee_id - フォロー解除
router.delete('/:followee_id', async (req, res, next) => {
  try {
    const followerId = req.user.id
    const followeeId = req.params.followee_id
    
    const result = await deleteFollow(followerId, followeeId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

export default router

