/**
 * スタンプ機能API
 */

/**
 * スタンプを押す/取り消す（トグル）
 * POST /api/posts/:id/stamps
 */
function handleToggleStamp(request) {
  try {
    const userId = getCurrentUserId(request);
    const postId = request.parameter.id;
    
    if (!postId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'Post ID is required')
      )
    }
    
    const body = getRequestBody(request);
    validateRequired(body, ['stamp_type']);
    const stampType = validateStampType(body.stamp_type);
    
    // 投稿の存在確認
    const postRowIndex = findRow('Posts', 1, postId);
    if (!postRowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'Post not found')
      )
    }
    
    // 既存のスタンプを検索
    const stampsData = getSheetData('Stamps');
    const stampsHeaders = getSheetHeaders('Stamps');
    const stampPostIdIndex = stampsHeaders.indexOf('post_id');
    const stampUserIdIndex = stampsHeaders.indexOf('user_id');
    const stampTypeIndex = stampsHeaders.indexOf('stamp_type');
    
    let existingStampRowIndex = null;
    let existingStampType = null;
    
    stampsData.forEach((row, index) => {
      if (row[stampPostIdIndex] === postId && row[stampUserIdIndex] === userId) {
        existingStampRowIndex = index + 2; // ヘッダー行を考慮
        existingStampType = row[stampTypeIndex];
      }
    });
    
    let action = 'added';
    
    if (existingStampRowIndex) {
      if (existingStampType === stampType) {
        // 同じスタンプを再押し → 削除
        deleteRow('Stamps', existingStampRowIndex);
        action = 'removed';
      } else {
        // 別のスタンプを押している → 既存を削除して新しいスタンプを追加
        deleteRow('Stamps', existingStampRowIndex);
        // 新しいスタンプを追加
        const stampId = generateUUID();
        const stampRow = [
          stampId,
          postId,
          userId,
          stampType,
          getCurrentDateTime()
        ];
        appendRow('Stamps', stampRow);
        action = 'replaced';
      }
    } else {
      // スタンプを押していない → 追加
      const stampId = generateUUID();
      const stampRow = [
        stampId,
        postId,
        userId,
        stampType,
        getCurrentDateTime()
      ];
      appendRow('Stamps', stampRow);
    }
    
    // 更新後のスタンプ情報を取得
    const updatedStampsData = getSheetData('Stamps');
    const stamps = {
      clap: 0,
      heart: 0,
      eye: 0,
      total: 0
    };
    
    updatedStampsData.forEach(row => {
      if (row[stampPostIdIndex] === postId) {
        const type = row[stampTypeIndex];
        stamps[type]++;
        stamps.total++;
      }
    });
    
    return createCorsResponse(
      createSuccessResponse({
        action: action,
        stamps: stamps
      })
    )
    
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      return createCorsResponse(
        createErrorResponse('UNAUTHORIZED', 'Authentication required')
      )
    }
    
    return createCorsResponse(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )
  }
}

/**
 * 投稿のスタンプ情報取得
 * GET /api/posts/:id/stamps
 */
function handleGetStamps(request) {
  try {
    const userId = getCurrentUserId(request);
    const postId = request.parameter.id;
    
    if (!postId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'Post ID is required')
      )
    }
    
    // 投稿の存在確認
    const postRowIndex = findRow('Posts', 1, postId);
    if (!postRowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'Post not found')
      )
    }
    
    // スタンプ情報を取得
    const stampsData = getSheetData('Stamps');
    const stampsHeaders = getSheetHeaders('Stamps');
    const stampPostIdIndex = stampsHeaders.indexOf('post_id');
    const stampUserIdIndex = stampsHeaders.indexOf('user_id');
    const stampTypeIndex = stampsHeaders.indexOf('stamp_type');
    
    const stamps = {
      clap: 0,
      heart: 0,
      eye: 0,
      total: 0
    };
    
    let myStamp = null;
    
    stampsData.forEach(row => {
      if (row[stampPostIdIndex] === postId) {
        const type = row[stampTypeIndex];
        stamps[type]++;
        stamps.total++;
        
        if (row[stampUserIdIndex] === userId) {
          myStamp = type;
        }
      }
    });
    
    return createCorsResponse(
      createSuccessResponse({
        stamps: stamps,
        my_stamp: myStamp
      })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

