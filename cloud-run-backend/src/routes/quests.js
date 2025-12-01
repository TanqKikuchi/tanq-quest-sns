import { Router } from 'express'
import { getCurrentQuest, listQuests, getQuestById } from '../services/questService.js'

const router = Router()

router.get('/current', async (req, res, next) => {
  try {
    const quest = await getCurrentQuest()
    res.json({ success: true, quest })
  } catch (error) {
    next(error)
  }
})

router.get('/', async (req, res, next) => {
  try {
    const limit = Number.parseInt(req.query.limit ?? '20', 10)
    const offset = Number.parseInt(req.query.offset ?? '0', 10)
    const result = await listQuests({
      chapter: req.query.chapter,
      limit: Number.isNaN(limit) ? 20 : limit,
      offset: Number.isNaN(offset) ? 0 : offset
    })
    res.json({ success: true, ...result })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const quest = await getQuestById(req.params.id)
    res.json({ success: true, quest })
  } catch (error) {
    next(error)
  }
})

export default router
