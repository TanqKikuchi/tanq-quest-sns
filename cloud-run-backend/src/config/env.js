import dotenv from 'dotenv'

const env = process.env.NODE_ENV || 'development'
const isProd = env === 'production'

if (!isProd) {
  dotenv.config()
}

function required (name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Environment variable ${name} is required`)
  }
  return value
}

function getPrivateKey () {
  const keyValue = required('GOOGLE_SERVICE_ACCOUNT_KEY')
  
  // JSON文字列の場合（Secret Managerから読み込んだ場合）
  if (keyValue.trim().startsWith('{')) {
    try {
      const keyJson = JSON.parse(keyValue)
      return keyJson.private_key || keyValue
    } catch (e) {
      // JSONパースに失敗した場合はそのまま返す
      return keyValue.replace(/\\n/g, '\n')
    }
  }
  
  // 通常の文字列の場合（改行を\nにエスケープした形式）
  return keyValue.replace(/\\n/g, '\n')
}

export const config = {
  env,
  isProd,
  port: process.env.PORT || 8080,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'https://tanqkikuchi.github.io')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean),
  google: {
    projectId: required('GCP_PROJECT_ID'),
    clientEmail: required('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    privateKey: getPrivateKey(),
    spreadsheetId: required('SPREADSHEET_ID'),
    imageFolderId: required('IMAGE_FOLDER_ID')
  }
}
