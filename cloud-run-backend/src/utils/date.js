export function getCurrentDateTime () {
  return new Date().toISOString()
}

export function getCurrentDate () {
  return new Date().toISOString().split('T')[0]
}

export function parseDate (value) {
  if (!value) return null
  return new Date(value)
}

export function isDateInRange (dateStr, startStr, endStr) {
  const date = parseDate(dateStr)
  const start = parseDate(startStr)
  const end = parseDate(endStr)
  if (!date || !start || !end) {
    return false
  }
  return date >= start && date <= end
}
