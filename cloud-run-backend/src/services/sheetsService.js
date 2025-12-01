import { getSheetsClient } from '../utils/googleClient.js'
import { config } from '../config/env.js'

const headerCache = new Map()

function columnNumberToLetter (column) {
  let temp = column
  let letter = ''
  while (temp > 0) {
    const mod = (temp - 1) % 26
    letter = String.fromCharCode(65 + mod) + letter
    temp = Math.floor((temp - mod) / 26)
  }
  return letter
}

function rowToObject (headers, row) {
  const obj = {}
  headers.forEach((header, index) => {
    obj[header] = row[index] ?? ''
  })
  return obj
}

export async function getHeaders (sheetName) {
  if (headerCache.has(sheetName)) {
    return headerCache.get(sheetName)
  }
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: `${sheetName}!1:1`
  })
  const headers = res.data.values?.[0] || []
  headerCache.set(sheetName, headers)
  return headers
}

export async function getAllRows (sheetName) {
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: sheetName
  })
  const values = res.data.values || []
  const headers = values[0] || []
  const rows = values.slice(1).map(row => rowToObject(headers, row))
  return { headers, rows }
}

export async function findRowByColumn (sheetName, columnName, value) {
  const headers = await getHeaders(sheetName)
  const columnIndex = headers.indexOf(columnName)
  if (columnIndex === -1) {
    throw new Error(`Column ${columnName} not found in ${sheetName}`)
  }
  const sheets = await getSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: config.google.spreadsheetId,
    range: sheetName
  })
  const rows = res.data.values || []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i]
    if ((row[columnIndex] || '').toLowerCase() === value.toLowerCase()) {
      return {
        rowIndex: i + 1,
        headers,
        row,
        object: rowToObject(headers, row)
      }
    }
  }
  return null
}

export async function updateCell (sheetName, rowIndex, columnName, newValue) {
  const headers = await getHeaders(sheetName)
  const columnIndex = headers.indexOf(columnName)
  if (columnIndex === -1) {
    throw new Error(`Column ${columnName} not found in ${sheetName}`)
  }
  const columnLetter = columnNumberToLetter(columnIndex + 1)
  const range = `${sheetName}!${columnLetter}${rowIndex}`
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.google.spreadsheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[newValue]] }
  })
}

export async function appendRow (sheetName, rowValues) {
  const sheets = await getSheetsClient()
  await sheets.spreadsheets.values.append({
    spreadsheetId: config.google.spreadsheetId,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [rowValues]
    }
  })
}

export async function rowToObjectById (sheetName, idColumnName, idValue) {
  const match = await findRowByColumn(sheetName, idColumnName, idValue)
  if (!match) {
    return null
  }
  return match
}
