import { v4 as uuidv4 } from 'uuid'
import { findRowByColumn, updateCell, appendRow, rowToObjectById } from './sheetsService.js'
import { getCurrentDateTime } from '../utils/date.js'
import { createHttpError } from '../utils/httpError.js'
import { validateRequiredFields, validateRole } from '../utils/validation.js'

const USERS_SHEET = 'Users'
const PROFILES_SHEET = 'Profiles'

function mapUser (rowObj) {
  if (!rowObj) return null
  return {
    id: rowObj.id,
    email: rowObj.email,
    role: rowObj.role,
    status: rowObj.status
  }
}

function mapProfile (rowObj) {
  if (!rowObj) return null
  return {
    user_id: rowObj.user_id,
    nickname: rowObj.nickname,
    grade: rowObj.grade,
    class_id: rowObj.class_id || null,
    school_id: rowObj.school_id,
    greeting: rowObj.greeting || null,
    level: Number(rowObj.level || 1),
    completed_chapter: rowObj.completed_chapter
  }
}

export async function login ({ email }) {
  if (!email) {
    throw createHttpError(400, 'VALIDATION_ERROR', 'Email is required')
  }
  const match = await findRowByColumn(USERS_SHEET, 'email', email)
  if (!match) {
    throw createHttpError(404, 'NOT_FOUND', 'User not found')
  }
  const user = match.object
  if (user.status !== 'active') {
    throw createHttpError(403, 'FORBIDDEN', 'Account is frozen')
  }
  await updateCell(USERS_SHEET, match.rowIndex, 'last_login_at', getCurrentDateTime())
  const profileMatch = await rowToObjectById(PROFILES_SHEET, 'user_id', user.id)
  return {
    user: mapUser(user),
    profile: mapProfile(profileMatch?.object)
  }
}

export async function getMe (userId) {
  if (!userId) {
    throw createHttpError(401, 'UNAUTHORIZED', 'Authentication required')
  }
  const userMatch = await rowToObjectById(USERS_SHEET, 'id', userId)
  if (!userMatch) {
    throw createHttpError(404, 'NOT_FOUND', 'User not found')
  }
  const profileMatch = await rowToObjectById(PROFILES_SHEET, 'user_id', userId)
  return {
    user: mapUser(userMatch.object),
    profile: mapProfile(profileMatch?.object)
  }
}

export async function createUser (payload) {
  validateRequiredFields(payload, ['email', 'role'])
  validateRequiredFields(payload.profile || {}, ['nickname', 'grade', 'school_id', 'completed_chapter'])

  const { email } = payload
  const role = validateRole(payload.role)
  const existing = await findRowByColumn(USERS_SHEET, 'email', email)
  if (existing) {
    throw createHttpError(409, 'DUPLICATE_ERROR', 'Email already exists')
  }

  const userId = uuidv4()
  const now = getCurrentDateTime()
  const userRow = [userId, email, role, 'active', now, '']
  await appendRow(USERS_SHEET, userRow)

  const profileData = payload.profile
  const profileRow = [
    userId,
    profileData.nickname,
    profileData.grade,
    profileData.class_id || '',
    profileData.school_id,
    profileData.greeting || '',
    profileData.level || 1,
    profileData.completed_chapter
  ]
  await appendRow(PROFILES_SHEET, profileRow)

  return {
    user: { id: userId, email, role, status: 'active' },
    profile: mapProfile({
      user_id: userId,
      nickname: profileData.nickname,
      grade: profileData.grade,
      class_id: profileData.class_id || null,
      school_id: profileData.school_id,
      greeting: profileData.greeting || null,
      level: profileData.level || 1,
      completed_chapter: profileData.completed_chapter
    })
  }
}
