import { Router } from 'express'
import { createUser } from '../services/authService.js'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const result = await createUser(req.body || {})
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

export default router
