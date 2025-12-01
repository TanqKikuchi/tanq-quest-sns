import { google } from 'googleapis'
import { config } from '../config/env.js'

let authClient

export function getGoogleAuthClient () {
  if (!authClient) {
    authClient = new google.auth.JWT({
      email: config.google.clientEmail,
      key: config.google.privateKey,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ]
    })
  }
  return authClient
}

export async function getSheetsClient () {
  const auth = getGoogleAuthClient()
  await auth.authorize()
  return google.sheets({ version: 'v4', auth })
}

export async function getDriveClient () {
  const auth = getGoogleAuthClient()
  await auth.authorize()
  return google.drive({ version: 'v3', auth })
}
