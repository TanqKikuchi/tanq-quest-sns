import { getAllRows, rowToObjectById } from './sheetsService.js'
import { getCurrentDate, isDateInRange, parseDate } from '../utils/date.js'
import { createHttpError } from '../utils/httpError.js'

const QUESTS_SHEET = 'Quests'

function mapQuest (row) {
  if (!row) return null
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    chapter: row.chapter,
    week_start: row.week_start,
    week_end: row.week_end,
    level: row.level,
    reward: row.reward,
    tips: row.tips || '',
    created_at: row.created_at || '',
    updated_at: row.updated_at || ''
  }
}

export async function getCurrentQuest () {
  const { rows } = await getAllRows(QUESTS_SHEET)
  const today = getCurrentDate()
  const quest = rows.find(row =>
    isDateInRange(today, row.week_start, row.week_end)
  )
  if (!quest) {
    throw createHttpError(404, 'NOT_FOUND', 'Current quest not found')
  }
  return mapQuest(quest)
}

export async function listQuests ({ chapter, limit = 20, offset = 0 }) {
  const { rows } = await getAllRows(QUESTS_SHEET)
  let filtered = rows
  if (chapter) {
    filtered = filtered.filter(row => String(row.chapter) === String(chapter))
  }
  filtered.sort((a, b) => {
    const dateA = parseDate(a.week_end)
    const dateB = parseDate(b.week_end)
    return dateB - dateA
  })
  const total = filtered.length
  const paginated = filtered.slice(offset, offset + limit).map(mapQuest)
  return {
    quests: paginated,
    total,
    limit,
    offset
  }
}

export async function getQuestById (id) {
  if (!id) {
    throw createHttpError(400, 'INVALID_REQUEST', 'Quest ID is required')
  }
  const match = await rowToObjectById(QUESTS_SHEET, 'id', id)
  if (!match) {
    throw createHttpError(404, 'NOT_FOUND', 'Quest not found')
  }
  return mapQuest(match.object)
}
