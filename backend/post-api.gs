/**
 * 投稿関連API
 */

/**
 * 投稿一覧取得（コミュニティタイムライン）
 * GET /api/posts
 */
function handleGetPosts(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 凍結チェック
    if (!isActive(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Account is frozen')
      )
    }
    
    const filter = getQueryParameter(request, 'filter', 'all');
    const filterValue = getQueryParameter(request, 'filter_value');
    const sort = getQueryParameter(request, 'sort', 'newest');
    const limit = parseInt(getQueryParameter(request, 'limit', 20));
    const offset = parseInt(getQueryParameter(request, 'offset', 0));
    
    let postsData = getSheetData('Posts');
    const postsHeaders = getSheetHeaders('Posts');
    
    // 公開投稿のみフィルタ
    const isPublicIndex = postsHeaders.indexOf('is_public');
    postsData = postsData.filter(row => {
      return row[isPublicIndex] === true || row[isPublicIndex] === 'true' || row[isPublicIndex] === 1;
    });
    
    // フィルタ適用
    if (filter === 'follow') {
      // フォローしているユーザーの投稿のみ
      const followsData = getSheetData('Follows');
      const followsHeaders = getSheetHeaders('Follows');
      const followerIdIndex = followsHeaders.indexOf('follower_id');
      const followeeIdIndex = followsHeaders.indexOf('followee_id');
      
      const followedUserIds = followsData
        .filter(row => row[followerIdIndex] === userId)
        .map(row => row[followeeIdIndex]);
      
      const userIdIndex = postsHeaders.indexOf('user_id');
      postsData = postsData.filter(row => {
        return followedUserIds.includes(row[userIdIndex]);
      });
    } else if (filter === 'school' && filterValue) {
      // 校舎別フィルタ
      const profilesData = getSheetData('Profiles');
      const profilesHeaders = getSheetHeaders('Profiles');
      const profileUserIdIndex = profilesHeaders.indexOf('user_id');
      const profileSchoolIdIndex = profilesHeaders.indexOf('school_id');
      
      const schoolUserIds = profilesData
        .filter(row => row[profileSchoolIdIndex] === filterValue)
        .map(row => row[profileUserIdIndex]);
      
      const userIdIndex = postsHeaders.indexOf('user_id');
      postsData = postsData.filter(row => {
        return schoolUserIds.includes(row[userIdIndex]);
      });
    } else if (filter === 'class' && filterValue) {
      // クラス別フィルタ
      const profilesData = getSheetData('Profiles');
      const profilesHeaders = getSheetHeaders('Profiles');
      const profileUserIdIndex = profilesHeaders.indexOf('user_id');
      const profileClassIdIndex = profilesHeaders.indexOf('class_id');
      
      const classUserIds = profilesData
        .filter(row => row[profileClassIdIndex] === filterValue)
        .map(row => row[profileUserIdIndex]);
      
      const userIdIndex = postsHeaders.indexOf('user_id');
      postsData = postsData.filter(row => {
        return classUserIds.includes(row[userIdIndex]);
      });
    } else if (filter === 'grade' && filterValue) {
      // 学年別フィルタ
      const profilesData = getSheetData('Profiles');
      const profilesHeaders = getSheetHeaders('Profiles');
      const profileUserIdIndex = profilesHeaders.indexOf('user_id');
      const profileGradeIndex = profilesHeaders.indexOf('grade');
      
      const gradeUserIds = profilesData
        .filter(row => String(row[profileGradeIndex]) === String(filterValue))
        .map(row => row[profileUserIdIndex]);
      
      const userIdIndex = postsHeaders.indexOf('user_id');
      postsData = postsData.filter(row => {
        return gradeUserIds.includes(row[userIdIndex]);
      });
    } else if (filter === 'level' && filterValue) {
      // レベル別フィルタ
      const profilesData = getSheetData('Profiles');
      const profilesHeaders = getSheetHeaders('Profiles');
      const profileUserIdIndex = profilesHeaders.indexOf('user_id');
      const profileLevelIndex = profilesHeaders.indexOf('level');
      
      const levelUserIds = profilesData
        .filter(row => String(row[profileLevelIndex]) === String(filterValue))
        .map(row => row[profileUserIdIndex]);
      
      const userIdIndex = postsHeaders.indexOf('user_id');
      postsData = postsData.filter(row => {
        return levelUserIds.includes(row[userIdIndex]);
      });
    }
    
    // ソート
    if (sort === 'newest') {
      const createdAtIndex = postsHeaders.indexOf('created_at');
      postsData.sort((a, b) => {
        const dateA = parseDate(a[createdAtIndex]);
        const dateB = parseDate(b[createdAtIndex]);
        return dateB - dateA; // 降順
      });
    } else if (sort === 'clap' || sort === 'heart' || sort === 'eye') {
      // スタンプ数でソート
      const stampsData = getSheetData('Stamps');
      const stampsHeaders = getSheetHeaders('Stamps');
      const stampPostIdIndex = stampsHeaders.indexOf('post_id');
      const stampTypeIndex = stampsHeaders.indexOf('stamp_type');
      
      // 各投稿のスタンプ数を計算
      const postStampCounts = {};
      postsData.forEach(row => {
        const postId = row[0]; // id列は1列目
        postStampCounts[postId] = 0;
      });
      
      stampsData.forEach(row => {
        const postId = row[stampPostIdIndex];
        const stampType = row[stampTypeIndex];
        if (postStampCounts[postId] !== undefined && stampType === sort) {
          postStampCounts[postId]++;
        }
      });
      
      postsData.sort((a, b) => {
        const countA = postStampCounts[a[0]] || 0;
        const countB = postStampCounts[b[0]] || 0;
        return countB - countA; // 降順
      });
    }
    
    // ページネーション
    const total = postsData.length;
    const paginatedData = postsData.slice(offset, offset + limit);
    
    // 投稿データを拡張（ユーザー情報、クエスト情報、スタンプ情報）
    const posts = paginatedData.map(row => {
      const post = {};
      postsHeaders.forEach((header, colIndex) => {
        post[header] = row[colIndex];
      });
      
      // ユーザー情報を追加
      const postUserId = post.user_id;
      const profileRowIndex = findRow('Profiles', 1, postUserId);
      if (profileRowIndex) {
        const profile = rowToObject('Profiles', profileRowIndex);
        post.user = {
          nickname: profile.nickname,
          grade: profile.grade,
          level: profile.level
        };
        
        // 校舎情報を追加
        if (profile.school_id) {
          const schoolRowIndex = findRow('Schools', 1, profile.school_id);
          if (schoolRowIndex) {
            const school = rowToObject('Schools', schoolRowIndex);
            post.user.school = school.name;
          }
        }
      }
      
      // クエスト情報を追加
      if (post.quest_id) {
        const questRowIndex = findRow('Quests', 1, post.quest_id);
        if (questRowIndex) {
          const quest = rowToObject('Quests', questRowIndex);
          post.quest = {
            id: quest.id,
            title: quest.title
          };
        }
      }
      
      // スタンプ情報を追加
      const stampsData = getSheetData('Stamps');
      const stampsHeaders = getSheetHeaders('Stamps');
      const stampPostIdIndex = stampsHeaders.indexOf('post_id');
      const stampUserIdIndex = stampsHeaders.indexOf('user_id');
      const stampTypeIndex = stampsHeaders.indexOf('stamp_type');
      
      const postStamps = {
        clap: 0,
        heart: 0,
        eye: 0,
        total: 0
      };
      
      let myStamp = null;
      
      stampsData.forEach(stampRow => {
        if (stampRow[stampPostIdIndex] === post.id) {
          const stampType = stampRow[stampTypeIndex];
          postStamps[stampType]++;
          postStamps.total++;
          
          if (stampRow[stampUserIdIndex] === userId) {
            myStamp = stampType;
          }
        }
      });
      
      post.stamps = postStamps;
      post.my_stamp = myStamp;
      
      // 画像URL配列に変換
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
    if (e.message === 'UNAUTHORIZED') {
      return createCorsResponse(
        createErrorResponse('UNAUTHORIZED', 'Authentication required')
      )
    }
    
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 特定クエストの投稿一覧取得
 * GET /api/posts/quest/:quest_id
 */
function handleGetPostsByQuest(request) {
  try {
    const userId = getCurrentUserId(request);
    const questId = request.parameter.quest_id;
    
    if (!questId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'Quest ID is required')
      )
    }
    
    let postsData = getSheetData('Posts');
    const postsHeaders = getSheetHeaders('Posts');
    const questIdIndex = postsHeaders.indexOf('quest_id');
    const isPublicIndex = postsHeaders.indexOf('is_public');
    
    // クエストIDでフィルタ、公開投稿のみ
    postsData = postsData.filter(row => {
      return row[questIdIndex] === questId && 
             (row[isPublicIndex] === true || row[isPublicIndex] === 'true' || row[isPublicIndex] === 1);
    });
    
    // 作成日時でソート（新しい順）
    const createdAtIndex = postsHeaders.indexOf('created_at');
    postsData.sort((a, b) => {
      const dateA = parseDate(a[createdAtIndex]);
      const dateB = parseDate(b[createdAtIndex]);
      return dateB - dateA;
    });
    
    // 投稿データを拡張（handleGetPostsと同じ処理）
    const posts = postsData.map(row => {
      const post = {};
      postsHeaders.forEach((header, colIndex) => {
        post[header] = row[colIndex];
      });
      
      // ユーザー情報、クエスト情報、スタンプ情報を追加
      // （handleGetPostsと同じ処理を簡略化）
      post.image_urls = stringToImageUrls(post.image_urls);
      
      return post;
    });
    
    return createCorsResponse(
      createSuccessResponse({ posts: posts })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 投稿詳細取得
 * GET /api/posts/:id
 */
function handleGetPost(request) {
  try {
    const postId = request.parameter.id;
    
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
    
    const post = rowToObject('Posts', rowIndex);
    post.image_urls = stringToImageUrls(post.image_urls);
    
    return createCorsResponse(
      createSuccessResponse({ post: post })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 投稿作成
 * POST /api/posts
 */
function handleCreatePost(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 凍結チェック
    if (!isActive(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Account is frozen')
      )
    }
    
    const body = getRequestBody(request);
    validateRequired(body, ['quest_id', 'effort_score', 'excitement_score']);
    
    // 1日1投稿制限チェック
    const today = getCurrentDate();
    const postLimitsData = getSheetData('PostLimits');
    const postLimitsHeaders = getSheetHeaders('PostLimits');
    const limitUserIdIndex = postLimitsHeaders.indexOf('user_id');
    const limitDateIndex = postLimitsHeaders.indexOf('date');
    const limitCountIndex = postLimitsHeaders.indexOf('post_count');
    
    const todayLimit = postLimitsData.find(row => {
      return row[limitUserIdIndex] === userId && row[limitDateIndex] === today;
    });
    
    if (todayLimit && todayLimit[limitCountIndex] >= 1) {
      return createCorsResponse(
        createErrorResponse('LIMIT_EXCEEDED', 'Only one post per day is allowed')
      )
    }
    
    // バリデーション
    const effortScore = validateRange(body.effort_score, 1, 5);
    const excitementScore = validateRange(body.excitement_score, 1, 5);
    
    if (body.image_urls) {
      validateArrayLength(body.image_urls, 4);
    }
    
    // 投稿作成
    const postId = generateUUID();
    const now = getCurrentDateTime();
    
    const postRow = [
      postId,
      userId,
      body.quest_id,
      body.title || '',
      body.body || '',
      imageUrlsToString(body.image_urls || []),
      effortScore,
      excitementScore,
      body.is_public !== undefined ? body.is_public : true,
      body.allow_promotion || false,
      now,
      now
    ];
    
    appendRow('Posts', postRow);
    
    // 投稿制限を更新
    if (todayLimit) {
      const limitRowIndex = findRow('PostLimits', 1, userId);
      if (limitRowIndex) {
        const sheet = getSheet('PostLimits');
        const headers = getSheetHeaders('PostLimits');
        const countIndex = headers.indexOf('post_count') + 1;
        sheet.getRange(limitRowIndex, countIndex).setValue(1);
      }
    } else {
      const limitRow = [
        userId,
        today,
        1,
        now
      ];
      appendRow('PostLimits', limitRow);
    }
    
    const post = rowToObject('Posts', findRow('Posts', 1, postId));
    post.image_urls = stringToImageUrls(post.image_urls);
    
    return createCorsResponse(
      createSuccessResponse({ post: post })
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
 * 投稿編集
 * PUT /api/posts/:id
 */
function handleUpdatePost(request) {
  try {
    const userId = getCurrentUserId(request);
    const postId = request.parameter.id;
    
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
    
    const post = rowToObject('Posts', rowIndex);
    
    // 権限チェック: 自分の投稿のみ編集可能
    if (post.user_id !== userId && !isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'You can only edit your own posts')
      )
    }
    
    const body = getRequestBody(request);
    
    // 更新可能なフィールドのみ更新
    const headers = getSheetHeaders('Posts');
    const sheet = getSheet('Posts');
    
    if (body.title !== undefined) {
      const index = headers.indexOf('title') + 1;
      sheet.getRange(rowIndex, index).setValue(body.title);
    }
    
    if (body.body !== undefined) {
      const index = headers.indexOf('body') + 1;
      sheet.getRange(rowIndex, index).setValue(body.body);
    }
    
    if (body.image_urls !== undefined) {
      validateArrayLength(body.image_urls, 4);
      const index = headers.indexOf('image_urls') + 1;
      sheet.getRange(rowIndex, index).setValue(imageUrlsToString(body.image_urls));
    }
    
    if (body.effort_score !== undefined) {
      const effortScore = validateRange(body.effort_score, 1, 5);
      const index = headers.indexOf('effort_score') + 1;
      sheet.getRange(rowIndex, index).setValue(effortScore);
    }
    
    if (body.excitement_score !== undefined) {
      const excitementScore = validateRange(body.excitement_score, 1, 5);
      const index = headers.indexOf('excitement_score') + 1;
      sheet.getRange(rowIndex, index).setValue(excitementScore);
    }
    
    if (body.allow_promotion !== undefined) {
      const index = headers.indexOf('allow_promotion') + 1;
      sheet.getRange(rowIndex, index).setValue(body.allow_promotion);
    }
    
    // updated_atを更新
    const updatedAtIndex = headers.indexOf('updated_at') + 1;
    sheet.getRange(rowIndex, updatedAtIndex).setValue(getCurrentDateTime());
    
    const updatedPost = rowToObject('Posts', rowIndex);
    updatedPost.image_urls = stringToImageUrls(updatedPost.image_urls);
    
    return createCorsResponse(
      createSuccessResponse({ post: updatedPost })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('VALIDATION_ERROR', e.message)
    )
  }
}

/**
 * 投稿削除
 * DELETE /api/posts/:id
 */
function handleDeletePost(request) {
  try {
    const userId = getCurrentUserId(request);
    const postId = request.parameter.id;
    
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
    
    const post = rowToObject('Posts', rowIndex);
    
    // 権限チェック: 自分の投稿または管理者・モデレーター
    if (post.user_id !== userId && !isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'You can only delete your own posts')
      )
    }
    
    // 投稿を削除
    deleteRow('Posts', rowIndex);
    
    // 関連するスタンプも削除
    const stampsData = getSheetData('Stamps');
    const stampsHeaders = getSheetHeaders('Stamps');
    const stampPostIdIndex = stampsHeaders.indexOf('post_id');
    
    stampsData.forEach((row, index) => {
      if (row[stampPostIdIndex] === postId) {
        deleteRow('Stamps', index + 2); // ヘッダー行を考慮
      }
    });
    
    return createCorsResponse(
      createSuccessResponse({ message: 'Post deleted successfully' })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 投稿の公開/非公開切替
 * PATCH /api/posts/:id/visibility
 */
function handleUpdatePostVisibility(request) {
  try {
    const userId = getCurrentUserId(request);
    const postId = request.parameter.id;
    
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
    
    const post = rowToObject('Posts', rowIndex);
    
    // 権限チェック: 自分の投稿のみ
    if (post.user_id !== userId && !isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'You can only change visibility of your own posts')
      )
    }
    
    const body = getRequestBody(request);
    
    if (body.is_public === undefined) {
      return createCorsResponse(
        createErrorResponse('VALIDATION_ERROR', 'is_public is required')
      )
    }
    
    const headers = getSheetHeaders('Posts');
    const sheet = getSheet('Posts');
    const isPublicIndex = headers.indexOf('is_public') + 1;
    sheet.getRange(rowIndex, isPublicIndex).setValue(body.is_public);
    
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
 * 自分の投稿一覧取得
 * GET /api/posts/my
 */
function handleGetMyPosts(request) {
  try {
    const userId = getCurrentUserId(request);
    
    let postsData = getSheetData('Posts');
    const postsHeaders = getSheetHeaders('Posts');
    const userIdIndex = postsHeaders.indexOf('user_id');
    
    // 自分の投稿のみフィルタ
    postsData = postsData.filter(row => row[userIdIndex] === userId);
    
    // 作成日時でソート（新しい順）
    const createdAtIndex = postsHeaders.indexOf('created_at');
    postsData.sort((a, b) => {
      const dateA = parseDate(a[createdAtIndex]);
      const dateB = parseDate(b[createdAtIndex]);
      return dateB - dateA;
    });
    
    // オブジェクトに変換
    const posts = postsData.map(row => {
      const post = {};
      postsHeaders.forEach((header, colIndex) => {
        post[header] = row[colIndex];
      });
      post.image_urls = stringToImageUrls(post.image_urls);
      return post;
    });
    
    return createCorsResponse(
      createSuccessResponse({ posts: posts })
    )
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

