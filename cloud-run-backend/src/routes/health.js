import { Router } from 'express'
import { config } from '../config/env.js'

const router = Router()

router.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'cloud-run-backend',
    env: config.env,
    timestamp: new Date().toISOString()
  })
})

export default router
