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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({
        posts: posts,
        total: total,
        limit: limit,
        offset: offset
      })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!postId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('INVALID_REQUEST', 'Post ID is required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const rowIndex = findRow('Posts', 1, postId);
    
    if (!rowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Post not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = getSheetHeaders('Posts');
    const sheet = getSheet('Posts');
    const isPublicIndex = headers.indexOf('is_public') + 1;
    sheet.getRange(rowIndex, isPublicIndex).setValue(false);
    
    const updatedPost = rowToObject('Posts', rowIndex);
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ post: updatedPost })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin access required')
      )).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ users: users })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin access required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!targetUserId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('INVALID_REQUEST', 'User ID is required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const body = getRequestBody(request);
    validateRequired(body, ['status']);
    const status = validateStatus(body.status);
    
    const rowIndex = findRow('Users', 1, targetUserId);
    
    if (!rowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'User not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = getSheetHeaders('Users');
    const sheet = getSheet('Users');
    const statusIndex = headers.indexOf('status') + 1;
    sheet.getRange(rowIndex, statusIndex).setValue(status);
    
    const updatedUser = rowToObject('Users', rowIndex);
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ user: updatedUser })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ reports: reports })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Post not found')
      )).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ report: report })
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
 * 通報対応ステータス更新
 * PATCH /api/admin/reports/:id
 */
function handleAdminUpdateReport(request) {
  try {
    const userId = getCurrentUserId(request);
    const reportId = request.parameter.id;
    
    // 権限チェック
    if (!isModeratorOrAdmin(userId)) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (!reportId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('INVALID_REQUEST', 'Report ID is required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const body = getRequestBody(request);
    
    const rowIndex = findRow('Reports', 1, reportId);
    
    if (!rowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Report not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const headers = getSheetHeaders('Reports');
    const sheet = getSheet('Reports');
    
    if (body.status !== undefined) {
      const validStatuses = ['pending', 'reviewed', 'resolved'];
      if (!validStatuses.includes(body.status)) {
        return ContentService.createTextOutput(JSON.stringify(
          createErrorResponse('VALIDATION_ERROR', 'Invalid status')
        )).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ report: updatedReport })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
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
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('FORBIDDEN', 'Admin or Moderator access required')
      )).setMimeType(ContentService.MimeType.JSON);
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
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ metrics: metrics })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

