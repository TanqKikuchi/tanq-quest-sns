import { Router } from 'express'

import { requireAuth } from '../middleware/auth.js'
import { uploadImages } from '../services/imageService.js'

const router = Router()

router.post('/upload-multiple', requireAuth, async (req, res, next) => {
  try {
    const images = req.body?.images

    const imageUrls = await uploadImages(images)

    res.status(201).json({
      success: true,
      image_urls: imageUrls
    })
  } catch (error) {
    next(error)
  }
})

export default router

