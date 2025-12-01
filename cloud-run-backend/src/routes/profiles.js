import { Router } from 'express'
import { getProfile, updateProfile } from '../services/profileService.js'
import { requireAuth } from '../middleware/auth.js'
import { createHttpError } from '../utils/httpError.js'

const router = Router()

// PUT /api/profiles/me - 自分のプロフィール更新
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id
    const updates = req.body
    
    const profile = await updateProfile(userId, updates)
    res.json({ success: true, profile })
  } catch (error) {
    if (error.message === 'Profile not found') {
      return next(createHttpError(404, 'NOT_FOUND', error.message))
    }
    next(error)
  }
})

// GET /api/profiles/:user_id - プロフィール取得
router.get('/:user_id', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.params.user_id
    
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_REQUEST', message: 'User ID is required' }
      })
    }
    
    const profile = await getProfile(targetUserId)
    res.json({ success: true, profile })
  } catch (error) {
    if (error.message === 'Profile not found') {
      return next(createHttpError(404, 'NOT_FOUND', error.message))
    }
    next(error)
  }
})

export default router

