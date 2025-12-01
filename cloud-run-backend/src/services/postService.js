import { getAllRows, findRowByColumn } from './sheetsService.js'
import { parseDate } from '../utils/date.js'

/**
 * 画像URL文字列を配列に変換
 */
function stringToImageUrls (imageUrlsStr) {
  if (!imageUrlsStr) return []
  if (Array.isArray(imageUrlsStr)) return imageUrlsStr
  return imageUrlsStr.split(',').filter(url => url.trim())
}

/**
 * 特定クエストの投稿一覧取得
 */
export async function getPostsByQuest (questId) {
  const { headers, rows } = await getAllRows('Posts')
  const questIdIndex = headers.indexOf('quest_id')
  const isPublicIndex = headers.indexOf('is_public')
  const createdAtIndex = headers.indexOf('created_at')

  // クエストIDでフィルタ、公開投稿のみ
  let postsData = rows.filter(row => {
    return row[questIdIndex] === questId &&
           (row[isPublicIndex] === true || row[isPublicIndex] === 'true' || row[isPublicIndex] === 1)
  })

  // 作成日時でソート（新しい順）
  postsData.sort((a, b) => {
    const dateA = parseDate(a[createdAtIndex])
    const dateB = parseDate(b[createdAtIndex])
    return dateB - dateA
  })

  // 投稿データを拡張
  const posts = await Promise.all(
    postsData.map(async (row) => {
      const post = {}
      headers.forEach((header, colIndex) => {
        post[header] = row[colIndex] ?? ''
      })

      // ユーザー情報を追加
      const userId = post.user_id
      if (userId) {
        const profileMatch = await findRowByColumn('Profiles', 'user_id', userId)
        if (profileMatch) {
          const profile = profileMatch.object
          post.user = {
            nickname: profile.nickname,
            grade: profile.grade,
            level: profile.level
          }

          // 校舎情報を追加
          if (profile.school_id) {
            const schoolMatch = await findRowByColumn('Schools', 'id', profile.school_id)
            if (schoolMatch) {
              const school = schoolMatch.object
              post.user.school = school.name
            }
          }
        }
      }

      // スタンプ情報を追加（簡易版）
      post.stamps = {
        clap: 0,
        heart: 0,
        eye: 0,
        total: 0
      }

      // 画像URL配列に変換
      post.image_urls = stringToImageUrls(post.image_urls)

      return post
    })
  )

  return { posts }
}

