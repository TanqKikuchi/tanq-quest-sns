import { findRowByColumn, getAllRows, updateCell } from './sheetsService.js'

/**
 * プロフィール取得
 */
export async function getProfile (targetUserId) {
  const profileMatch = await findRowByColumn('Profiles', 'user_id', targetUserId)
  
  if (!profileMatch) {
    throw new Error('Profile not found')
  }
  
  const profile = profileMatch.object
  
  // クラス情報を追加
  if (profile.class_id) {
    const classMatch = await findRowByColumn('Classes', 'id', profile.class_id)
    if (classMatch) {
      const classData = classMatch.object
      profile.class = {
        id: classData.id,
        name: classData.name
      }
    }
  }
  
  // 校舎情報を追加
  if (profile.school_id) {
    const schoolMatch = await findRowByColumn('Schools', 'id', profile.school_id)
    if (schoolMatch) {
      const schoolData = schoolMatch.object
      profile.school = {
        id: schoolData.id,
        name: schoolData.name
      }
    }
  }
  
  // 投稿数を取得
  const { rows: postsRows } = await getAllRows('Posts')
  const userIdKey = 'user_id'
  const postCount = postsRows.filter(row => row[userIdKey] === targetUserId).length
  profile.post_count = postCount
  
  // スタンプ総数を取得
  const userPosts = postsRows.filter(row => row[userIdKey] === targetUserId)
  const postIds = userPosts.map(post => post.id)
  
  const { rows: stampsRows } = await getAllRows('Stamps')
  const stampPostIdKey = 'post_id'
  
  let totalStamps = 0
  stampsRows.forEach(row => {
    if (postIds.includes(row[stampPostIdKey])) {
      totalStamps++
    }
  })
  profile.total_stamps = totalStamps
  
  // バッジ情報を取得
  const { rows: userBadgesRows } = await getAllRows('UserBadges')
  const badgeUserIdKey = 'user_id'
  const badgeIdKey = 'badge_id'
  
  const userBadges = userBadgesRows
    .filter(row => row[badgeUserIdKey] === targetUserId)
    .map(row => row[badgeIdKey])
  
  profile.badges = userBadges
  
  return profile
}

/**
 * プロフィール更新
 */
export async function updateProfile (userId, updates) {
  const profileMatch = await findRowByColumn('Profiles', 'user_id', userId)
  
  if (!profileMatch) {
    throw new Error('Profile not found')
  }
  
  const rowIndex = profileMatch.rowIndex
  
  // 更新可能なフィールドのみ更新
  const allowedFields = ['nickname', 'greeting', 'grade', 'class_id', 'completed_chapter']
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      await updateCell('Profiles', rowIndex, key, value)
    }
  }
  
  // 更新後のプロフィールを取得
  return await getProfile(userId)
}

