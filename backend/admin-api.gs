/**
 * 管理者機能API
 */

/**
 * 投稿管理一覧（管理者・モデレーター用）
 * GET /api/admin/posts
 */
function handleAdminGetPosts(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 権限チェック
    if (!isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )
    }
    
    const search = getQueryParameter(request, 'search');
    const status = getQueryParameter(request, 'status');
    const limit = parseInt(getQueryParameter(request, 'limit', 20));
    const offset = parseInt(getQueryParameter(request, 'offset', 0));
    
    let postsData = getSheetData('Posts');
    const postsHeaders = getSheetHeaders('Posts');
    const isPublicIndex = postsHeaders.indexOf('is_public');
    
    // 公開状態でフィルタ
    if (status === 'public') {
      postsData = postsData.filter(row => {
        return row[isPublicIndex] === true || row[isPublicIndex] === 'true' || row[isPublicIndex] === 1;
      });
    } else if (status === 'private') {
      postsData = postsData.filter(row => {
        return row[isPublicIndex] === false || row[isPublicIndex] === 'false' || row[isPublicIndex] === 0;
      });
    }
    
    // 検索（タイトル・本文）
    if (search) {
      const titleIndex = postsHeaders.indexOf('title');
      const bodyIndex = postsHeaders.indexOf('body');
      
      postsData = postsData.filter(row => {
        const title = String(row[titleIndex] || '').toLowerCase();
        const body = String(row[bodyIndex] || '').toLowerCase();
        const searchLower = search.toLowerCase();
        return title.includes(searchLower) || body.includes(searchLower);
      });
    }
    
    // 作成日時でソート（新しい順）
    const createdAtIndex = postsHeaders.indexOf('created_at');
    postsData.sort((a, b) => {
      const dateA = parseDate(a[createdAtIndex]);
      const dateB = parseDate(b[createdAtIndex]);
      return dateB - dateA;
    });
    
    // ページネーション
    const total = postsData.length;
    const paginatedData = postsData.slice(offset, offset + limit);
    
    // オブジェクトに変換
    const posts = paginatedData.map(row => {
      const post = {};
      postsHeaders.forEach((header, colIndex) => {
        post[header] = row[colIndex];
      });
      post.image_urls = stringToImageUrls(post.image_urls);
      return post;
    });
    
    return createCorsResponse(
      createSuccessResponse({
        posts: posts,
        total: total,
        limit: limit,
        offset: offset
      })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 投稿を強制非公開（管理者・モデレーター用）
 * PATCH /api/admin/posts/:id/force-hide
 */
function handleAdminForceHidePost(request) {
  try {
    const userId = getCurrentUserId(request);
    const postId = request.parameter.id;
    
    // 権限チェック
    if (!isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )
    }
    
    if (!postId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'Post ID is required')
      )
    }
    
    const rowIndex = findRow('Posts', 1, postId);
    
    if (!rowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'Post not found')
      )
    }
    
    const headers = getSheetHeaders('Posts');
    const sheet = getSheet('Posts');
    const isPublicIndex = headers.indexOf('is_public') + 1;
    sheet.getRange(rowIndex, isPublicIndex).setValue(false);
    
    const updatedPost = rowToObject('Posts', rowIndex);
    
    return createCorsResponse(
      createSuccessResponse({ post: updatedPost })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * ユーザー一覧取得（管理者用）
 * GET /api/admin/users
 */
function handleAdminGetUsers(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 権限チェック: 管理者のみ
    if (!isAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin access required')
      )
    }
    
    const usersData = getSheetData('Users');
    const usersHeaders = getSheetHeaders('Users');
    
    const users = usersData.map(row => {
      const user = {};
      usersHeaders.forEach((header, colIndex) => {
        user[header] = row[colIndex];
      });
      return user;
    });
    
    return createCorsResponse(
      createSuccessResponse({ users: users })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * アカウント状態変更（凍結/解除）
 * PATCH /api/admin/users/:id/status
 */
function handleAdminUpdateUserStatus(request) {
  try {
    const userId = getCurrentUserId(request);
    const targetUserId = request.parameter.id;
    
    // 権限チェック: 管理者のみ
    if (!isAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin access required')
      )
    }
    
    if (!targetUserId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'User ID is required')
      )
    }
    
    const body = getRequestBody(request);
    validateRequired(body, ['status']);
    const status = validateStatus(body.status);
    
    const rowIndex = findRow('Users', 1, targetUserId);
    
    if (!rowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'User not found')
      )
    }
    
    const headers = getSheetHeaders('Users');
    const sheet = getSheet('Users');
    const statusIndex = headers.indexOf('status') + 1;
    sheet.getRange(rowIndex, statusIndex).setValue(status);
    
    const updatedUser = rowToObject('Users', rowIndex);
    
    return createCorsResponse(
      createSuccessResponse({ user: updatedUser })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )
  }
}

/**
 * 通報一覧取得（管理者・モデレーター用）
 * GET /api/admin/reports
 */
function handleAdminGetReports(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 権限チェック
    if (!isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )
    }
    
    const status = getQueryParameter(request, 'status');
    
    let reportsData = getSheetData('Reports');
    const reportsHeaders = getSheetHeaders('Reports');
    const statusIndex = reportsHeaders.indexOf('status');
    
    // ステータスでフィルタ
    if (status) {
      reportsData = reportsData.filter(row => row[statusIndex] === status);
    }
    
    // 作成日時でソート（新しい順）
    const createdAtIndex = reportsHeaders.indexOf('created_at');
    reportsData.sort((a, b) => {
      const dateA = parseDate(a[createdAtIndex]);
      const dateB = parseDate(b[createdAtIndex]);
      return dateB - dateA;
    });
    
    // オブジェクトに変換
    const reports = reportsData.map(row => {
      const report = {};
      reportsHeaders.forEach((header, colIndex) => {
        report[header] = row[colIndex];
      });
      return report;
    });
    
    return createCorsResponse(
      createSuccessResponse({ reports: reports })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 通報作成
 * POST /api/admin/reports
 */
function handleCreateReport(request) {
  try {
    const userId = getCurrentUserId(request);
    const body = getRequestBody(request);
    validateRequired(body, ['post_id', 'reason']);
    
    const postId = body.post_id;
    
    // 投稿の存在確認
    const postRowIndex = findRow('Posts', 1, postId);
    if (!postRowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'Post not found')
      )
    }
    
    // 通報作成
    const reportId = generateUUID();
    const now = getCurrentDateTime();
    
    const reportRow = [
      reportId,
      postId,
      userId,
      body.reason,
      'pending',
      '', // handled_by
      now,
      now
    ];
    
    appendRow('Reports', reportRow);
    
    const report = rowToObject('Reports', findRow('Reports', 1, reportId));
    
    return createCorsResponse(
      createSuccessResponse({ report: report })
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
 * 通報対応ステータス更新
 * PATCH /api/admin/reports/:id
 */
function handleAdminUpdateReport(request) {
  try {
    const userId = getCurrentUserId(request);
    const reportId = request.parameter.id;
    
    // 権限チェック
    if (!isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )
    }
    
    if (!reportId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'Report ID is required')
      )
    }
    
    const body = getRequestBody(request);
    
    const rowIndex = findRow('Reports', 1, reportId);
    
    if (!rowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'Report not found')
      )
    }
    
    const headers = getSheetHeaders('Reports');
    const sheet = getSheet('Reports');
    
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'reviewed', 'resolved'];
      if (!validStatuses.includes(body.status)) {
        return createCorsResponse(
          createErrorResponse('VALIDATION_ERROR', 'Invalid status')
        )
      }
      
      const statusIndex = headers.indexOf('status') + 1;
      sheet.getRange(rowIndex, statusIndex).setValue(body.status);
    }
    
    if (body.handled_by !== undefined) {
      const handledByIndex = headers.indexOf('handled_by') + 1;
      sheet.getRange(rowIndex, handledByIndex).setValue(body.handled_by);
    }
    
    // updated_atを更新
    const updatedAtIndex = headers.indexOf('updated_at') + 1;
    sheet.getRange(rowIndex, updatedAtIndex).setValue(getCurrentDateTime());
    
    const updatedReport = rowToObject('Reports', rowIndex);
    
    return createCorsResponse(
      createSuccessResponse({ report: updatedReport })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )
  }
}

/**
 * メトリクス取得（管理者・モデレーター用）
 * GET /api/admin/metrics
 */
function handleAdminGetMetrics(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 権限チェック
    if (!isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )
    }
    
    const weekStart = getQueryParameter(request, 'week_start');
    const weekEnd = getQueryParameter(request, 'week_end');
    
    let postsData = getSheetData('Posts');
    const postsHeaders = getSheetHeaders('Posts');
    const createdAtIndex = postsHeaders.indexOf('created_at');
    const effortScoreIndex = postsHeaders.indexOf('effort_score');
    const excitementScoreIndex = postsHeaders.indexOf('excitement_score');
    const userIdIndex = postsHeaders.indexOf('user_id');
    
    // 週でフィルタ
    if (weekStart && weekEnd) {
      postsData = postsData.filter(row => {
        const postDate = parseDate(row[createdAtIndex]);
        return isDateInRange(postDate.toISOString().split('T')[0], weekStart, weekEnd);
      });
    }
    
    // ユニーク投稿者数
    const uniquePosters = new Set(postsData.map(row => row[userIdIndex])).size;
    
    // アクティブユーザー数（投稿したユーザー）
    const activeUsers = uniquePosters;
    
    // 投稿数
    const postCount = postsData.length;
    
    // スタンプ総数
    const stampsData = getSheetData('Stamps');
    const postIds = postsData.map(row => row[0]); // id列は1列目
    const stampsHeaders = getSheetHeaders('Stamps');
    const stampPostIdIndex = stampsHeaders.indexOf('post_id');
    const totalStamps = stampsData.filter(row => postIds.includes(row[stampPostIdIndex])).length;
    
    // 平均頑張った度/わくわく度
    let totalEffort = 0;
    let totalExcitement = 0;
    postsData.forEach(row => {
      totalEffort += Number(row[effortScoreIndex]) || 0;
      totalExcitement += Number(row[excitementScoreIndex]) || 0;
    });
    const avgEffortScore = postCount > 0 ? totalEffort / postCount : 0;
    const avgExcitementScore = postCount > 0 ? totalExcitement / postCount : 0;
    
    // 校舎別分布
    const profilesData = getSheetData('Profiles');
    const profilesHeaders = getSheetHeaders('Profiles');
    const profileUserIdIndex = profilesHeaders.indexOf('user_id');
    const profileSchoolIdIndex = profilesHeaders.indexOf('school_id');
    
    const distributionBySchool = {};
    postsData.forEach(row => {
      const postUserId = row[userIdIndex];
      const profile = profilesData.find(p => p[profileUserIdIndex] === postUserId);
      if (profile && profile[profileSchoolIdIndex]) {
        const schoolId = profile[profileSchoolIdIndex];
        distributionBySchool[schoolId] = (distributionBySchool[schoolId] || 0) + 1;
      }
    });
    
    // 学年別分布
    const profileGradeIndex = profilesHeaders.indexOf('grade');
    const distributionByGrade = {};
    postsData.forEach(row => {
      const postUserId = row[userIdIndex];
      const profile = profilesData.find(p => p[profileUserIdIndex] === postUserId);
      if (profile && profile[profileGradeIndex]) {
        const grade = String(profile[profileGradeIndex]);
        distributionByGrade[grade] = (distributionByGrade[grade] || 0) + 1;
      }
    });
    
    const metrics = {
      unique_posters: uniquePosters,
      active_users: activeUsers,
      post_count: postCount,
      total_stamps: totalStamps,
      avg_effort_score: Math.round(avgEffortScore * 10) / 10,
      avg_excitement_score: Math.round(avgExcitementScore * 10) / 10,
      distribution: {
        by_school: distributionBySchool,
        by_grade: distributionByGrade
      }
    };
    
    return createCorsResponse(
      createSuccessResponse({ metrics: metrics })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

