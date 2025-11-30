/**
 * プロフィール関連API
 */

/**
 * プロフィール取得
 * GET /api/profiles/:user_id
 */
function handleGetProfile(request) {
  try {
    const targetUserId = request.parameter.user_id;
    
    if (!targetUserId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('INVALID_REQUEST', 'User ID is required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    // プロフィール情報を取得
    const profileRowIndex = findRow('Profiles', 1, targetUserId);
    
    if (!profileRowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Profile not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const profile = rowToObject('Profiles', profileRowIndex);
    
    // クラス情報を追加
    if (profile.class_id) {
      const classRowIndex = findRow('Classes', 1, profile.class_id);
      if (classRowIndex) {
        const classData = rowToObject('Classes', classRowIndex);
        profile.class = {
          id: classData.id,
          name: classData.name
        };
      }
    }
    
    // 校舎情報を追加
    if (profile.school_id) {
      const schoolRowIndex = findRow('Schools', 1, profile.school_id);
      if (schoolRowIndex) {
        const schoolData = rowToObject('Schools', schoolRowIndex);
        profile.school = {
          id: schoolData.id,
          name: schoolData.name
        };
      }
    }
    
    // 投稿数を取得
    const postsData = getSheetData('Posts');
    const postsHeaders = getSheetHeaders('Posts');
    const userIdIndex = postsHeaders.indexOf('user_id');
    const postCount = postsData.filter(row => row[userIdIndex] === targetUserId).length;
    profile.post_count = postCount;
    
    // スタンプ総数を取得
    const posts = postsData.filter(row => row[userIdIndex] === targetUserId);
    const postIds = posts.map(row => row[0]); // id列は1列目
    
    const stampsData = getSheetData('Stamps');
    const stampsHeaders = getSheetHeaders('Stamps');
    const stampPostIdIndex = stampsHeaders.indexOf('post_id');
    
    let totalStamps = 0;
    stampsData.forEach(row => {
      if (postIds.includes(row[stampPostIdIndex])) {
        totalStamps++;
      }
    });
    profile.total_stamps = totalStamps;
    
    // バッジ情報を取得
    const userBadgesData = getSheetData('UserBadges');
    const userBadgesHeaders = getSheetHeaders('UserBadges');
    const badgeUserIdIndex = userBadgesHeaders.indexOf('user_id');
    const badgeIdIndex = userBadgesHeaders.indexOf('badge_id');
    
    const userBadges = userBadgesData
      .filter(row => row[badgeUserIdIndex] === targetUserId)
      .map(row => {
        const badgeId = row[badgeIdIndex];
        const badgeRowIndex = findRow('Badges', 1, badgeId);
        if (badgeRowIndex) {
          return rowToObject('Badges', badgeRowIndex);
        }
        return null;
      })
      .filter(badge => badge !== null);
    
    profile.badges = userBadges;
    
    // フォロー数を取得（フォロワー数は非表示）
    const followsData = getSheetData('Follows');
    const followsHeaders = getSheetHeaders('Follows');
    const followerIdIndex = followsHeaders.indexOf('follower_id');
    const followCount = followsData.filter(row => row[followerIdIndex] === targetUserId).length;
    profile.follow_count = followCount;
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ profile: profile })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 自分のプロフィール更新
 * PUT /api/profiles/me
 */
function handleUpdateProfile(request) {
  try {
    const userId = getCurrentUserId(request);
    const body = getRequestBody(request);
    
    const profileRowIndex = findRow('Profiles', 1, userId);
    
    if (!profileRowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Profile not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 更新可能なフィールドのみ更新
    const headers = getSheetHeaders('Profiles');
    const sheet = getSheet('Profiles');
    
    if (body.nickname !== undefined) {
      const index = headers.indexOf('nickname') + 1;
      sheet.getRange(profileRowIndex, index).setValue(body.nickname);
    }
    
    if (body.greeting !== undefined) {
      const index = headers.indexOf('greeting') + 1;
      sheet.getRange(profileRowIndex, index).setValue(body.greeting);
    }
    
    if (body.grade !== undefined) {
      const index = headers.indexOf('grade') + 1;
      sheet.getRange(profileRowIndex, index).setValue(body.grade);
    }
    
    if (body.class_id !== undefined) {
      const index = headers.indexOf('class_id') + 1;
      sheet.getRange(profileRowIndex, index).setValue(body.class_id || '');
    }
    
    if (body.completed_chapter !== undefined) {
      const index = headers.indexOf('completed_chapter') + 1;
      sheet.getRange(profileRowIndex, index).setValue(body.completed_chapter);
    }
    
    const updatedProfile = rowToObject('Profiles', profileRowIndex);
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ profile: updatedProfile })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('UNAUTHORIZED', 'Authentication required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

