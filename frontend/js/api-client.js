/**
 * APIクライアント
 * GAS Web Apps APIとの通信を管理
 */

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || '';
    this.currentUser = null;
    this.currentProfile = null;
  }

  /**
   * APIリクエストを送信
   * 
   * 注意: GAS Web AppsはOPTIONSリクエスト（CORS preflight）をサポートしていないため、
   * Content-Type: text/plain を使用してプリフライトリクエストを回避します。
   */
  async request(path, options = {}) {
    // GAS Web Appsの場合、POSTリクエストでもクエリパラメータを使用
    let url = `${this.baseUrl}?path=${encodeURIComponent(path)}`;
    
    // 認証情報をクエリパラメータに追加（ヘッダーの代わりに）
    if (this.currentUser && this.currentUser.id) {
      url += `&user_id=${encodeURIComponent(this.currentUser.id)}`;
    }
    
    // _methodパラメータを追加（PUT/DELETE/PATCHの場合）
    if (options.headers && options.headers['_method']) {
      url += `&_method=${encodeURIComponent(options.headers['_method'])}`;
    }
    
    const config = {
      method: options.method || 'GET',
      // Content-Type: text/plain を使用してプリフライトリクエストを回避
      headers: {
        'Content-Type': 'text/plain'
      }
    };

    // リクエストボディ（JSON文字列として送信）
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // レスポンステキストを取得
      const text = await response.text();
      
      // JSONとしてパース
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}`);
      }

      if (!data.success) {
        const errorCode = data.error?.code || 'UNKNOWN_ERROR';
        const errorMessage = data.error?.message || 'API request failed';
        const error = new Error(errorMessage);
        error.code = errorCode;
        throw error;
      }

      return data;
    } catch (error) {
      // エラーハンドラーで処理（ui-common.jsが読み込まれている場合）
      if (typeof errorHandler !== 'undefined') {
        errorHandler.handle(error, `API: ${path}`);
      }
      throw error;
    }
  }

  /**
   * GETリクエスト
   */
  async get(path, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const fullPath = queryString ? `${path}?${queryString}` : path;
    return this.request(fullPath, { method: 'GET' });
  }

  /**
   * POSTリクエスト
   */
  async post(path, body = {}) {
    return this.request(path, {
      method: 'POST',
      body: body
    });
  }

  /**
   * PUTリクエスト
   */
  async put(path, body = {}) {
    return this.request(path, {
      method: 'POST',
      headers: { '_method': 'PUT' },
      body: body
    });
  }

  /**
   * DELETEリクエスト
   */
  async delete(path) {
    return this.request(path, {
      method: 'POST',
      headers: { '_method': 'DELETE' }
    });
  }

  /**
   * PATCHリクエスト
   */
  async patch(path, body = {}) {
    return this.request(path, {
      method: 'POST',
      headers: { '_method': 'PATCH' },
      body: body
    });
  }

  /**
   * ログイン
   */
  async login(email) {
    const response = await this.post('api/auth/login', { email });
    this.currentUser = response.user;
    this.currentProfile = response.profile;
    this.saveSession();
    return response;
  }

  /**
   * ログアウト
   */
  async logout() {
    await this.post('api/auth/logout');
    this.currentUser = null;
    this.currentProfile = null;
    this.clearSession();
  }

  /**
   * 現在のユーザー情報取得
   */
  async getMe() {
    const response = await this.get('api/auth/me');
    this.currentUser = response.user;
    this.currentProfile = response.profile;
    return response;
  }

  /**
   * セッションを保存
   */
  saveSession() {
    if (this.currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      localStorage.setItem('currentProfile', JSON.stringify(this.currentProfile));
    }
  }

  /**
   * セッションを復元
   */
  restoreSession() {
    const userStr = localStorage.getItem('currentUser');
    const profileStr = localStorage.getItem('currentProfile');
    
    if (userStr) {
      this.currentUser = JSON.parse(userStr);
      this.currentProfile = profileStr ? JSON.parse(profileStr) : null;
    }
  }

  /**
   * セッションをクリア
   */
  clearSession() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentProfile');
  }

  /**
   * 認証状態をチェック
   */
  isAuthenticated() {
    return this.currentUser !== null;
  }
}

// グローバルインスタンス
const apiClient = new ApiClient();

