/**
 * 認証・ユーザー管理API
 */

/**
 * ユーザーログイン
 * POST /api/auth/login
 */
function handleLogin(request) {
  try {
    const body = getRequestBody(request);
    validateRequired(body, ['email']);
    
    const email = body.email;
    
    // Usersテーブルから検索
    const rowIndex = findRow('Users', 2, email); // email列は2列目
    
    if (!rowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'User not found')
      );
    }
    
    const user = rowToObject('Users', rowIndex);
    
    // ステータスチェック
    if (user.status !== 'active') {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Account is frozen')
      );
    }
    
    // 最終ログイン日時を更新
    const headers = getSheetHeaders('Users');
    const lastLoginIndex = headers.indexOf('last_login_at') + 1;
    const sheet = getSheet('Users');
    sheet.getRange(rowIndex, lastLoginIndex).setValue(getCurrentDateTime());
    
    // プロフィール情報を取得
    const profileRowIndex = findRow('Profiles', 1, user.id); // user_id列は1列目
    let profile = null;
    
    if (profileRowIndex) {
      profile = rowToObject('Profiles', profileRowIndex);
    }
    
    return createCorsResponse(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        },
        profile: profile
      })
    );
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    );
  }
}

/**
 * ユーザーログアウト
 * POST /api/auth/logout
 */
function handleLogout(request) {
  // セッション管理を使用する場合は、ここでセッションを無効化
  return createCorsResponse(
    createSuccessResponse({ message: 'Logged out successfully' })
  );
}

/**
 * 現在のユーザー情報取得
 * GET /api/auth/me
 */
function handleGetMe(request) {
  try {
    const userId = getCurrentUserId(request);
    
    const userRowIndex = findRow('Users', 1, userId);
    if (!userRowIndex) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'User not found')
      );
    }
    
    const user = rowToObject('Users', userRowIndex);
    
    // プロフィール情報を取得
    const profileRowIndex = findRow('Profiles', 1, userId);
    let profile = null;
    
    if (profileRowIndex) {
      profile = rowToObject('Profiles', profileRowIndex);
    }
    
    return createCorsResponse(
      createSuccessResponse({
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status
        },
        profile: profile
      })
    );
    
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      return createCorsResponse(
        createErrorResponse('UNAUTHORIZED', 'Authentication required')
      );
    }
    
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    );
  }
}

/**
 * ユーザー作成（初回登録）
 * POST /api/users
 */
function handleCreateUser(request) {
  try {
    const body = getRequestBody(request);
    validateRequired(body, ['email', 'role']);
    validateRequired(body.profile || {}, ['nickname', 'grade', 'school_id', 'completed_chapter']);
    
    const email = body.email;
    const role = validateRole(body.role);
    const profileData = body.profile;
    
    // メールアドレスの重複チェック
    const existingRowIndex = findRow('Users', 2, email);
    if (existingRowIndex) {
      return createCorsResponse(
        createErrorResponse('DUPLICATE_ERROR', 'Email already exists')
      );
    }
    
    // ユーザー作成
    const userId = generateUUID();
    const now = getCurrentDateTime();
    
    const userRow = [
      userId,
      email,
      role,
      'active',
      now,
      '' // last_login_at
    ];
    
    appendRow('Users', userRow);
    
    // プロフィール作成
    const profileRow = [
      userId,
      profileData.nickname,
      profileData.grade,
      profileData.class_id || '',
      profileData.school_id,
      profileData.greeting || '',
      profileData.level || 1,
      profileData.completed_chapter
    ];
    
    appendRow('Profiles', profileRow);
    
    // 作成したユーザー情報を取得
    const user = {
      id: userId,
      email: email,
      role: role,
      status: 'active'
    };
    
    const profile = {
      user_id: userId,
      nickname: profileData.nickname,
      grade: profileData.grade,
      class_id: profileData.class_id || null,
      school_id: profileData.school_id,
      greeting: profileData.greeting || null,
      level: profileData.level || 1,
      completed_chapter: profileData.completed_chapter
    };
    
    return createCorsResponse(
      createSuccessResponse({
        user: user,
        profile: profile
      })
    );
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('VALIDATION_ERROR', e.message)
    );
  }
}

