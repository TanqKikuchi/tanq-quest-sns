import { createHttpError } from './httpError.js'

export function validateRequiredFields (obj, fields) {
  const missing = []
  fields.forEach(field => {
    const value = obj[field]
    if (value === undefined || value === null || value === '') {
      missing.push(field)
    }
  })
  if (missing.length > 0) {
    throw createHttpError(400, 'VALIDATION_ERROR', `Missing required fields: ${missing.join(', ')}`)
  }
}

const VALID_ROLES = ['Admin', 'Moderator', 'Student', 'Parent', 'Graduate', 'Staff']

export function validateRole (role) {
  if (!VALID_ROLES.includes(role)) {
    throw createHttpError(400, 'VALIDATION_ERROR', `Invalid role: ${role}`)
  }
  return role
}
