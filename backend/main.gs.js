/**
 * Web Apps API エントリーポイント
 * 
 * このファイルをGAS Web Appsとしてデプロイすると、
 * すべてのAPIエンドポイントが利用可能になります。
 * 
 * デプロイ方法:
 * 1. Apps Scriptエディタで「デプロイ」>「新しいデプロイ」を選択
 * 2. 種類として「ウェブアプリ」を選択
 * 3. 実行ユーザーを選択
 * 4. アクセス権限を「全員」または「自分」に設定
 * 5. 「デプロイ」をクリック
 */

/**
 * doGet/doPost エントリーポイント
 * 
 * 注意: GASでは doGet と doPost のみサポートされています。
 * PUT/DELETE/PATCH は POST で _method パラメータを使用するか、
 * パスで判定します。
 */
function doGet(e) {
  const result = handleRequest(e, 'GET');
  // HtmlServiceでラップしてCORSヘッダーを追加
  return wrapResponse(result);
}

function doPost(e) {
  // _method パラメータでHTTPメソッドを指定可能
  const method = e.parameter._method || 'POST';
  const result = handleRequest(e, method);
  // HtmlServiceでラップしてCORSヘッダーを追加
  return wrapResponse(result);
}

/**
 * OPTIONSリクエストを処理（CORS preflight）
 */
function doOptions(e) {
  return HtmlService.createHtmlOutput('')
    .setContentType('text/plain')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * レスポンスをHtmlServiceでラップしてCORS対応
 */
function wrapResponse(result) {
  // 既にHtmlServiceの場合はそのまま返す
  if (result instanceof HtmlService.HtmlOutput) {
    return result;
  }
  
  // ContentServiceの場合はHtmlServiceでラップ
  if (result instanceof ContentService.TextOutput) {
    const json = result.getContent();
    return HtmlService.createHtmlOutput(json)
      .setContentType('application/json')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }
  
  // その他の場合はそのまま返す
  return result;
}

/**
 * リクエストをルーティング
 */
function handleRequest(e, method) {
  try {
    // OPTIONSリクエストの処理
    if (method === 'OPTIONS') {
      return doOptions(e);
    }
    
    // パスを取得（クエリパラメータまたはパスパラメータから）
    let path = e.parameter.path || '';
    
    // パスが空の場合は、パスパラメータから取得を試みる
    if (!path && e.pathInfo) {
      path = e.pathInfo;
    }
    
    const pathParts = path.split('/').filter(p => p !== '');
    
    // ルーティング
    if (pathParts.length === 0 || pathParts[0] === 'api') {
      const apiPath = pathParts[0] === 'api' ? pathParts.slice(1) : pathParts;
      return routeApi(apiPath, e, method);
    }
    
    // デフォルト: 404
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('NOT_FOUND', 'Endpoint not found')
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', error.toString())
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * APIルーティング
 */
function routeApi(pathParts, e, method) {
  if (pathParts.length === 0) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('NOT_FOUND', 'API endpoint not found')
    )).setMimeType(ContentService.MimeType.JSON);
  }
  
  const resource = pathParts[0];
  const subResource = pathParts[1];
  const id = pathParts[2];
  const action = pathParts[3];
  
  // 認証・ユーザー管理
  if (resource === 'auth') {
    if (subResource === 'login' && method === 'POST') {
      return handleLogin(e);
    } else if (subResource === 'logout' && method === 'POST') {
      return handleLogout(e);
    } else if (subResource === 'me' && method === 'GET') {
      return handleGetMe(e);
    }
  }
  
  // ユーザー作成
  if (resource === 'users' && method === 'POST') {
    return handleCreateUser(e);
  }
  
  // クエスト関連
  if (resource === 'quests') {
    if (subResource === 'current' && method === 'GET') {
      return handleGetCurrentQuest(e);
    } else if (!subResource && method === 'GET') {
      return handleGetQuests(e);
    } else if (id && method === 'GET') {
      e.parameter.id = id;
      return handleGetQuest(e);
    }
  }
  
  // 投稿関連
  if (resource === 'posts') {
    if (subResource === 'quest' && pathParts[2] && method === 'GET') {
      e.parameter.quest_id = pathParts[2];
      return handleGetPostsByQuest(e);
    } else if (subResource === 'my' && method === 'GET') {
      return handleGetMyPosts(e);
    } else if (id && action === 'stamps' && method === 'POST') {
      e.parameter.id = id;
      return handleToggleStamp(e);
    } else if (id && action === 'stamps' && method === 'GET') {
      e.parameter.id = id;
      return handleGetStamps(e);
    } else if (id && action === 'visibility' && method === 'PATCH') {
      e.parameter.id = id;
      return handleUpdatePostVisibility(e);
    } else if (id && method === 'GET') {
      e.parameter.id = id;
      return handleGetPost(e);
    } else if (id && method === 'PUT') {
      e.parameter.id = id;
      return handleUpdatePost(e);
    } else if (id && method === 'DELETE') {
      e.parameter.id = id;
      return handleDeletePost(e);
    } else if (method === 'GET') {
      return handleGetPosts(e);
    } else if (method === 'POST') {
      return handleCreatePost(e);
    }
  }
  
  // フォロー関連
  if (resource === 'follows') {
    if (id && method === 'DELETE') {
      e.parameter.followee_id = id;
      return handleDeleteFollow(e);
    } else if (method === 'GET') {
      return handleGetFollows(e);
    } else if (method === 'POST') {
      return handleCreateFollow(e);
    }
  }
  
  // プロフィール関連
  if (resource === 'profiles') {
    if (subResource === 'me' && method === 'PUT') {
      return handleUpdateProfile(e);
    } else if (id && method === 'GET') {
      e.parameter.user_id = id;
      return handleGetProfile(e);
    }
  }
  
  // 管理者機能
  if (resource === 'admin') {
    // 投稿管理
    if (subResource === 'posts') {
      if (id && action === 'force-hide' && method === 'PATCH') {
        e.parameter.id = id;
        return handleAdminForceHidePost(e);
      } else if (method === 'GET') {
        return handleAdminGetPosts(e);
      }
    }
    
    // ユーザー管理
    if (subResource === 'users') {
      if (id && action === 'status' && method === 'PATCH') {
        e.parameter.id = id;
        return handleAdminUpdateUserStatus(e);
      } else if (method === 'GET') {
        return handleAdminGetUsers(e);
      }
    }
    
    // 通報管理
    if (subResource === 'reports') {
      if (id && method === 'PATCH') {
        e.parameter.id = id;
        return handleAdminUpdateReport(e);
      } else if (method === 'GET') {
        return handleAdminGetReports(e);
      } else if (method === 'POST') {
        return handleCreateReport(e);
      }
    }
    
    // メトリクス
    if (subResource === 'metrics' && method === 'GET') {
      return handleAdminGetMetrics(e);
    }
  }
  
  // 通報作成（一般ユーザー用）
  if (resource === 'reports' && method === 'POST') {
    return handleCreateReport(e);
  }
  
  // 画像アップロード
  if (resource === 'images') {
    if (subResource === 'upload' && method === 'POST') {
      return handleUploadImage(e);
    } else if (subResource === 'upload-multiple' && method === 'POST') {
      return handleUploadMultipleImages(e);
    } else if (id && method === 'DELETE') {
      e.parameter.file_id = id;
      return handleDeleteImage(e);
    }
  }
  
  // 404
  return ContentService.createTextOutput(JSON.stringify(
    createErrorResponse('NOT_FOUND', 'API endpoint not found')
  )).setMimeType(ContentService.MimeType.JSON);
}

/**
 * CORS対応のヘッダーを設定
 * 注意: GAS Web Appsでは、レスポンスヘッダーの設定が制限されているため、
 * HtmlServiceを使用してCORS対応を行います。
 */
function setCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
  };
}