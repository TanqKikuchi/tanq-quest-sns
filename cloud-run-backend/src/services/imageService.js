import { Readable } from 'stream'
import { v4 as uuidv4 } from 'uuid'

import { getDriveClient } from '../utils/googleClient.js'
import { config } from '../config/env.js'
import { createHttpError } from '../utils/httpError.js'

const MAX_IMAGES = 4
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

function base64ToBuffer (data) {
  if (!data) return null
  const base64 = data.includes('base64,')
    ? data.split('base64,')[1]
    : data
  return Buffer.from(base64, 'base64')
}

async function uploadSingleImage (drive, image, index) {
  const { data, filename, mime_type: mimeType } = image || {}

  if (!data || !filename || !mimeType) {
    throw createHttpError(400, 'VALIDATION_ERROR', `画像データ(${index + 1}枚目)が不正です`)
  }

  const buffer = base64ToBuffer(data)

  if (!buffer || buffer.length === 0) {
    throw createHttpError(400, 'VALIDATION_ERROR', `画像データ(${index + 1}枚目)を読み込めませんでした`)
  }

  if (buffer.length > MAX_IMAGE_SIZE) {
    throw createHttpError(400, 'VALIDATION_ERROR', `画像データ(${index + 1}枚目)が上限(5MB)を超えています`)
  }

  const uniqueName = `${Date.now()}-${uuidv4()}-${filename}`

  const fileResponse = await drive.files.create({
    requestBody: {
      name: uniqueName,
      parents: [config.google.imageFolderId]
    },
    media: {
      mimeType,
      body: Readable.from(buffer)
    },
    fields: 'id',
    supportsAllDrives: true
  })

  const fileId = fileResponse.data.id

  if (!fileId) {
    throw createHttpError(500, 'DRIVE_ERROR', 'Google DriveのファイルID取得に失敗しました')
  }

  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone'
    },
    supportsAllDrives: true
  })

  return `https://drive.google.com/uc?export=view&id=${fileId}`
}

export async function uploadImages (images) {
  if (!Array.isArray(images) || images.length === 0) {
    throw createHttpError(400, 'VALIDATION_ERROR', 'images配列が必要です')
  }

  if (images.length > MAX_IMAGES) {
    throw createHttpError(400, 'VALIDATION_ERROR', `画像は最大${MAX_IMAGES}枚までです`)
  }

  if (!config.google.imageFolderId) {
    throw createHttpError(500, 'CONFIG_ERROR', '画像フォルダIDが設定されていません')
  }

  const drive = await getDriveClient()

  const uploadedUrls = []

  for (let i = 0; i < images.length; i++) {
    const url = await uploadSingleImage(drive, images[i], i)
    uploadedUrls.push(url)
  }

  return uploadedUrls
}

