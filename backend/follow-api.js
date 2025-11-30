/**
 * フォロー機能API
 */

/**
 * フォロー追加
 * POST /api/follows
 */
function handleCreateFollow(request) {
  try {
    const userId = getCurrentUserId(request);
    const body = getRequestBody(request);
    validateRequired(body, ['followee_id']);
    
    const followeeId = body.followee_id;
    
    // 自分自身をフォローできない
    if (userId === followeeId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('VALIDATION_ERROR', 'Cannot follow yourself')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 既にフォローしているかチェック
    const followsData = getSheetData('Follows');
    const followsHeaders = getSheetHeaders('Follows');
    const followerIdIndex = followsHeaders.indexOf('follower_id');
    const followeeIdIndex = followsHeaders.indexOf('followee_id');
    
    const existingFollow = followsData.find(row => {
      return row[followerIdIndex] === userId && row[followeeIdIndex] === followeeId;
    });
    
    if (existingFollow) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('DUPLICATE_ERROR', 'Already following this user')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    // フォロー追加
    const followRow = [
      userId,
      followeeId,
      getCurrentDateTime()
    ];
    
    appendRow('Follows', followRow);
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ message: 'Followed successfully' })
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

/**
 * フォロー解除
 * DELETE /api/follows/:followee_id
 */
function handleDeleteFollow(request) {
  try {
    const userId = getCurrentUserId(request);
    const followeeId = request.parameter.followee_id;
    
    if (!followeeId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('INVALID_REQUEST', 'Followee ID is required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    // フォロー関係を検索
    const followsData = getSheetData('Follows');
    const followsHeaders = getSheetHeaders('Follows');
    const followerIdIndex = followsHeaders.indexOf('follower_id');
    const followeeIdIndex = followsHeaders.indexOf('followee_id');
    
    let followRowIndex = null;
    
    followsData.forEach((row, index) => {
      if (row[followerIdIndex] === userId && row[followeeIdIndex] === followeeId) {
        followRowIndex = index + 2; // ヘッダー行を考慮
      }
    });
    
    if (!followRowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Follow relationship not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    // フォロー解除
    deleteRow('Follows', followRowIndex);
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ message: 'Unfollowed successfully' })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * フォロー一覧取得
 * GET /api/follows
 */
function handleGetFollows(request) {
  try {
    const targetUserId = getQueryParameter(request, 'user_id');
    const userId = targetUserId || getCurrentUserId(request);
    
    // フォロー一覧を取得
    const followsData = getSheetData('Follows');
    const followsHeaders = getSheetHeaders('Follows');
    const followerIdIndex = followsHeaders.indexOf('follower_id');
    const followeeIdIndex = followsHeaders.indexOf('followee_id');
    const createdAtIndex = followsHeaders.indexOf('created_at');
    
    // 指定ユーザーのフォロー一覧をフィルタ
    const userFollows = followsData.filter(row => row[followerIdIndex] === userId);
    
    // フォロー対象のユーザー情報を取得
    const follows = userFollows.map(row => {
      const followeeId = row[followeeIdIndex];
      
      // プロフィール情報を取得
      const profileRowIndex = findRow('Profiles', 1, followeeId);
      let followee = null;
      
      if (profileRowIndex) {
        const profile = rowToObject('Profiles', profileRowIndex);
        followee = {
          user_id: followeeId,
          nickname: profile.nickname,
          grade: profile.grade,
          level: profile.level
        };
        
        // 校舎情報を追加
        if (profile.school_id) {
          const schoolRowIndex = findRow('Schools', 1, profile.school_id);
          if (schoolRowIndex) {
            const school = rowToObject('Schools', schoolRowIndex);
            followee.school = school.name;
          }
        }
      }
      
      return {
        followee_id: followeeId,
        followee: followee,
        created_at: row[createdAtIndex]
      };
    });
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({
        follows: follows,
        count: follows.length
      })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

