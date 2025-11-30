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
   */
  async request(path, options = {}) {
    const url = `${this.baseUrl}?path=${encodeURIComponent(path)}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // 認証情報を追加
    if (this.currentUser && this.currentUser.id) {
      config.headers['X-User-Id'] = this.currentUser.id;
    }

    // リクエストボディ
    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);
      
      // ネットワークエラーのチェック
      if (!response.ok) {
        throw new Error(`Network error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

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

