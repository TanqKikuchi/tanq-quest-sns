import { Router } from 'express'
import { getPostsByQuest } from '../services/postService.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

// GET /api/posts/quest/:quest_id - 特定クエストの投稿一覧取得
router.get('/quest/:quest_id', requireAuth, async (req, res, next) => {
  try {
    const questId = req.params.quest_id
    
    if (!questId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'Quest ID is required' }
      })
    }
    
    const result = await getPostsByQuest(questId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

export default router

