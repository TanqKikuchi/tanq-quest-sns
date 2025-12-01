/**
 * APIクライアント
 * GAS Web Apps APIとの通信を管理
 */

const DEFAULT_API_BASE_URL =
  (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || '';

class ApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || DEFAULT_API_BASE_URL || '';
    this.currentUser = null;
    this.currentProfile = null;
  }

  ensureBaseUrl() {
    if (!this.baseUrl) {
      throw new Error('APIベースURLが設定されていません (frontend/js/config.js を確認してください)');
    }
  }

  /**
   * APIリクエストを送信
   * 
   * Cloud RunとGAS Web Appsの両方に対応
   * - Cloud Run: 通常のREST API形式（直接パス指定、JSONリクエスト）
   * - GAS Web Apps: クエリパラメータ形式（?path=...、form-urlencoded）
   */
  async request(path, options = {}) {
    // ベースURLを確実にセット
    if (!this.baseUrl && DEFAULT_API_BASE_URL) {
      this.baseUrl = DEFAULT_API_BASE_URL;
    }
    this.ensureBaseUrl();

    // Cloud Runかどうかを判定（.run.appで終わる）
    const isCloudRun = this.baseUrl.includes('.run.app');
    
    let url;
    const method = options.method || 'GET';
    const config = { method };

    if (isCloudRun) {
      // Cloud Run: 通常のREST API形式
      url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
      
      // 認証情報をクエリパラメータに追加（GAS互換性のため）
      if (this.currentUser && this.currentUser.id) {
        const separator = url.includes('?') ? '&' : '?';
        url += `${separator}user_id=${encodeURIComponent(this.currentUser.id)}`;
      }
      
      if (method !== 'GET' && options.body) {
        config.headers = {
          'Content-Type': 'application/json',
          ...config.headers
        };
        config.body = JSON.stringify(options.body);
      }
    } else {
      // GAS Web Apps: クエリパラメータ形式
      const separator = this.baseUrl.includes('?') ? '&' : '?';
      url = `${this.baseUrl}${separator}path=${encodeURIComponent(path)}`;
      
      // 認証情報をクエリパラメータに追加
      if (this.currentUser && this.currentUser.id) {
        url += `&user_id=${encodeURIComponent(this.currentUser.id)}`;
      }
      
      // _methodパラメータを追加（PUT/DELETE/PATCHの場合）
      if (options.headers && options.headers['_method']) {
        url += `&_method=${encodeURIComponent(options.headers['_method'])}`;
      }
      
      if (method !== 'GET') {
        const formData = new URLSearchParams();
        formData.append('payload', options.body ? JSON.stringify(options.body) : '{}');
        config.headers = {
          'Content-Type': 'application/x-www-form-urlencoded',
          ...config.headers
        };
        config.body = formData.toString();
      }
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
    const isCloudRun = this.baseUrl.includes('.run.app');
    return this.request(path, {
      method: isCloudRun ? 'PUT' : 'POST',
      headers: isCloudRun ? {} : { '_method': 'PUT' },
      body: body
    });
  }

  /**
   * DELETEリクエスト
   */
  async delete(path) {
    const isCloudRun = this.baseUrl.includes('.run.app');
    return this.request(path, {
      method: isCloudRun ? 'DELETE' : 'POST',
      headers: isCloudRun ? {} : { '_method': 'DELETE' }
    });
  }

  /**
   * PATCHリクエスト
   */
  async patch(path, body = {}) {
    const isCloudRun = this.baseUrl.includes('.run.app');
    return this.request(path, {
      method: isCloudRun ? 'PATCH' : 'POST',
      headers: isCloudRun ? {} : { '_method': 'PATCH' },
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

