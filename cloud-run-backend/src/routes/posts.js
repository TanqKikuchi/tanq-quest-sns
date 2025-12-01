import { Router } from 'express'
import { getPostsByQuest, getPosts, getMyPosts } from '../services/postService.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/posts/quest/:quest_id - 特定クエストの投稿一覧取得
router.get('/quest/:quest_id', requireAuth, async (req, res, next) => {
  try {
    const questId = req.params.quest_id
    const userId = req.user.id
    
    if (!questId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Quest ID is required' }
      })
    }
    
    const result = await getPostsByQuest(questId, userId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

// GET /api/posts - 投稿一覧取得（コミュニティタイムライン）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const filter = req.query.filter || 'all'
    const filterValue = req.query.filter_value || null
    const sort = req.query.sort || 'newest'
    const limit = parseInt(req.query.limit || 20)
    const offset = parseInt(req.query.offset || 0)
    
    const result = await getPosts(userId, {
      filter,
      filterValue,
      sort,
      limit,
      offset
    })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

// GET /api/posts/my - 自分の投稿一覧取得
router.get('/my', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const result = await getMyPosts(userId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

export default router

