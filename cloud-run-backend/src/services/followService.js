import { getAllRows, findRowByColumn, appendRow, getHeaders } from './sheetsService.js'
import { getSheetsClient } from '../utils/googleClient.js'
import { config } from '../config/env.js'
import { createHttpError } from '../utils/httpError.js'
import { getCurrentDateTime } from '../utils/date.js'

/**
 * フォロー一覧取得
 */
export async function getFollows (userId) {
  const { headers, rows } = await getAllRows('Follows')
  const followerIdIndex = headers.indexOf('follower_id')
  const followeeIdIndex = headers.indexOf('followee_id')
  const createdAtIndex = headers.indexOf('created_at')

  // 指定ユーザーのフォロー一覧をフィルタ
  const userFollows = rows.filter(row => row[followerIdIndex] === userId)

  // フォロー対象のユーザー情報を取得
  const follows = await Promise.all(
    userFollows.map(async (row) => {
      const followeeId = row[followeeIdIndex]

      // プロフィール情報を取得
      const profileMatch = await findRowByColumn('Profiles', 'user_id', followeeId)
      let followee = null

      if (profileMatch) {
        const profile = profileMatch.object
        followee = {
          user_id: followeeId,
          nickname: profile.nickname,
          grade: profile.grade,
          level: profile.level
        }

        // 校舎情報を追加
        if (profile.school_id) {
          const schoolMatch = await findRowByColumn('Schools', 'id', profile.school_id)
          if (schoolMatch) {
            const school = schoolMatch.object
            followee.school = school.name
          }
        }
      }

      return {
        followee_id: followeeId,
        followee: followee,
        created_at: row[createdAtIndex]
      }
    })
  )

  return {
    follows: follows,
    count: follows.length
  }
}

/**
 * フォロー追加
 */
export async function createFollow (followerId, followeeId) {
  // 自分自身をフォローできない
  if (followerId === followeeId) {
    throw createHttpError(400, 'VALIDATION_ERROR', 'Cannot follow yourself')
  }

  // 既にフォローしているかチェック
  const { headers, rows } = await getAllRows('Follows')
  const followerIdIndex = headers.indexOf('follower_id')
  const followeeIdIndex = headers.indexOf('followee_id')

  const existingFollow = rows.find(
    row => row[followerIdIndex] === followerId && row[followeeIdIndex] === followeeId
  )

  if (existingFollow) {
    throw createHttpError(409, 'DUPLICATE_ERROR', 'Already following this user')
  }

  // フォロー追加
  const followRow = [
    followerId,
    followeeId,
    getCurrentDateTime()
  ]

  await appendRow('Follows', followRow)

  return { message: 'Followed successfully' }
}

/**
 * フォロー解除
 */
export async function deleteFollow (followerId, followeeId) {
  const { headers, rows } = await getAllRows('Follows')
  const followerIdIndex = headers.indexOf('follower_id')
  const followeeIdIndex = headers.indexOf('followee_id')

  // フォロー関係を検索
  let followRowIndex = null

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (row[followerIdIndex] === followerId && row[followeeIdIndex] === followeeId) {
      followRowIndex = i + 2 // ヘッダー行を考慮
      break
    }
  }

  if (!followRowIndex) {
    throw createHttpError(404, 'NOT_FOUND', 'Follow relationship not found')
  }

  // フォロー解除（行を削除）
  // 注意: Google Sheets APIでは行の削除が複雑なため、一旦空文字で上書きする簡易実装
  // 本番環境では適切な削除方法を実装する必要があります
  const sheets = await getSheetsClient()
  const emptyRow = new Array(headers.length).fill('')
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: config.google.spreadsheetId,
    range: `Follows!${followRowIndex}:${followRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [emptyRow] }
  })

  return { message: 'Unfollowed successfully' }
}

