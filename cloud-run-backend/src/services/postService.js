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
 * 投稿データを拡張（ユーザー情報、スタンプ情報を追加）
 */
async function enrichPost (post, userId = null) {
  // ユーザー情報を追加
  if (post.user_id) {
    const profileMatch = await findRowByColumn('Profiles', 'user_id', post.user_id)
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
  const { rows: stampsRows } = await getAllRows('Stamps')
  const stampPostIdKey = 'post_id'
  const stampTypeKey = 'stamp_type'
  const stampUserIdKey = 'user_id'

  post.stamps = {
    clap: 0,
    heart: 0,
    eye: 0,
    total: 0
  }
  post.my_stamp = null

  stampsRows.forEach(stampRow => {
    if (stampRow[stampPostIdKey] === post.id) {
      const stampType = stampRow[stampTypeKey]
      if (post.stamps[stampType] !== undefined) {
        post.stamps[stampType]++
        post.stamps.total++
      }
      if (userId && stampRow[stampUserIdKey] === userId) {
        post.my_stamp = stampType
      }
    }
  })

  // 画像URL配列に変換
  post.image_urls = stringToImageUrls(post.image_urls)

  return post
}

/**
 * 特定クエストの投稿一覧取得
 */
export async function getPostsByQuest (questId, userId = null) {
  const { rows } = await getAllRows('Posts')
  const questIdKey = 'quest_id'
  const isPublicKey = 'is_public'
  const createdAtKey = 'created_at'

  // クエストIDでフィルタ、公開投稿のみ
  let postsData = rows.filter(row => {
    return row[questIdKey] === questId &&
           (row[isPublicKey] === true || row[isPublicKey] === 'true' || row[isPublicKey] === 1)
  })

  // 作成日時でソート（新しい順）
  postsData.sort((a, b) => {
    const dateA = parseDate(a[createdAtKey])
    const dateB = parseDate(b[createdAtKey])
    return dateB - dateA
  })

  // 投稿データを拡張（既にオブジェクトなのでそのまま使用）
  const posts = await Promise.all(
    postsData.map(async (post) => {
      return await enrichPost(post, userId)
    })
  )

  return { posts }
}

/**
 * 投稿一覧取得（コミュニティタイムライン）
 */
export async function getPosts (userId, options = {}) {
  const {
    filter = 'all',
    filterValue = null,
    sort = 'newest',
    limit = 20,
    offset = 0
  } = options

  const { headers, rows } = await getAllRows('Posts')
  const isPublicKey = 'is_public'
  const userIdKey = 'user_id'
  const createdAtKey = 'created_at'

  // 公開投稿のみフィルタ
  let postsData = rows.filter(row => {
    return row[isPublicKey] === true || row[isPublicKey] === 'true' || row[isPublicKey] === 1
  })

  // フィルタ適用
  if (filter === 'follow') {
    // フォローしているユーザーの投稿のみ
    const { headers: followsHeaders, rows: followsRows } = await getAllRows('Follows')
    const followerIdIndex = followsHeaders.indexOf('follower_id')
    const followeeIdIndex = followsHeaders.indexOf('followee_id')

    const followerIdKey = 'follower_id'
    const followeeIdKey = 'followee_id'
    const followedUserIds = followsRows
      .filter(row => row[followerIdKey] === userId)
      .map(row => row[followeeIdKey])

    postsData = postsData.filter(row => {
      return followedUserIds.includes(row[userIdKey])
    })
  } else if (filter === 'school' && filterValue) {
    // 校舎別フィルタ
    const { rows: profilesRows } = await getAllRows('Profiles')
    const profileUserIdKey = 'user_id'
    const profileSchoolIdKey = 'school_id'

    const schoolUserIds = profilesRows
      .filter(row => row[profileSchoolIdKey] === filterValue)
      .map(row => row[profileUserIdKey])

    postsData = postsData.filter(row => {
      return schoolUserIds.includes(row[userIdKey])
    })
  } else if (filter === 'class' && filterValue) {
    // クラス別フィルタ
    const { rows: profilesRows } = await getAllRows('Profiles')
    const profileUserIdKey = 'user_id'
    const profileClassIdKey = 'class_id'

    const classUserIds = profilesRows
      .filter(row => row[profileClassIdKey] === filterValue)
      .map(row => row[profileUserIdKey])

    postsData = postsData.filter(row => {
      return classUserIds.includes(row[userIdKey])
    })
  } else if (filter === 'grade' && filterValue) {
    // 学年別フィルタ
    const { rows: profilesRows } = await getAllRows('Profiles')
    const profileUserIdKey = 'user_id'
    const profileGradeKey = 'grade'

    const gradeUserIds = profilesRows
      .filter(row => String(row[profileGradeKey]) === String(filterValue))
      .map(row => row[profileUserIdKey])

    postsData = postsData.filter(row => {
      return gradeUserIds.includes(row[userIdKey])
    })
  } else if (filter === 'level' && filterValue) {
    // レベル別フィルタ
    const { rows: profilesRows } = await getAllRows('Profiles')
    const profileUserIdKey = 'user_id'
    const profileLevelKey = 'level'

    const levelUserIds = profilesRows
      .filter(row => String(row[profileLevelKey]) === String(filterValue))
      .map(row => row[profileUserIdKey])

    postsData = postsData.filter(row => {
      return levelUserIds.includes(row[userIdKey])
    })
  }

  // ソート
  if (sort === 'newest') {
    postsData.sort((a, b) => {
      const dateA = parseDate(a[createdAtKey])
      const dateB = parseDate(b[createdAtKey])
      return dateB - dateA
    })
  } else if (sort === 'clap' || sort === 'heart' || sort === 'eye') {
    // スタンプ数でソート（簡易版、後で最適化可能）
    // 一旦作成日時でソート
    postsData.sort((a, b) => {
      const dateA = parseDate(a[createdAtIndex])
      const dateB = parseDate(b[createdAtIndex])
      return dateB - dateA
    })
  }

  // ページネーション
  const total = postsData.length
  const paginatedData = postsData.slice(offset, offset + limit)

  // 投稿データを拡張（既にオブジェクトなのでそのまま使用）
  const posts = await Promise.all(
    paginatedData.map(async (post) => {
      return await enrichPost(post, userId)
    })
  )

  return {
    posts,
    total,
    limit,
    offset
  }
}

/**
 * 自分の投稿一覧取得
 */
export async function getMyPosts (userId) {
  const { rows } = await getAllRows('Posts')
  const userIdKey = 'user_id'
  const createdAtKey = 'created_at'

  // 自分の投稿のみフィルタ
  let postsData = rows.filter(row => row[userIdKey] === userId)

  // 作成日時でソート（新しい順）
  postsData.sort((a, b) => {
    const dateA = parseDate(a[createdAtKey])
    const dateB = parseDate(b[createdAtKey])
    return dateB - dateA
  })

  // 投稿データを拡張（既にオブジェクトなのでそのまま使用）
  const posts = await Promise.all(
    postsData.map(async (post) => {
      return await enrichPost(post, userId)
    })
  )

  return { posts }
}

