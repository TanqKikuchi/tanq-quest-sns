import { Router } from 'express'
import { login, getMe } from '../services/authService.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const result = await login({ email: req.body?.email })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' })
})

router.get('/me', async (req, res, next) => {
  try {
    const userId = req.header('x-user-id') || req.query.user_id
    const result = await getMe(userId)
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

export default router
