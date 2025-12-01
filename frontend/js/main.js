/**
 * メインスクリプト
 * アプリケーションの初期化
 */

// APIベースURLの設定
// 本番環境では、GAS Web AppsのデプロイURLを設定
// 例: apiClient.baseUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// config.js で定義した値を参照
const resolvedBaseUrl =
  window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL;

if (resolvedBaseUrl) {
  apiClient.baseUrl = resolvedBaseUrl;
} else if (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1'
) {
  // ローカル開発環境
  // apiClient.baseUrl = 'http://localhost:8080';
} else {
  console.error('APIベースURLが設定されていません。frontend/js/config.js を確認してください。');
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('SNS App initialized');
  
  // セッションを復元
  apiClient.restoreSession();
  
  // ヘッダーの表示制御
  updateHeaderVisibility();
  
  // 管理者リンクの表示制御
  updateAdminLinkVisibility();
  
  // 認証状態に応じてページを表示
  if (apiClient.isAuthenticated()) {
    // 認証済み: ハッシュに応じたページを表示
    const hash = window.location.hash.slice(1);
    if (hash) {
      router.navigate(hash);
    } else {
      router.navigate('quest');
    }
  } else {
    // 未認証: ログイン画面を表示
    router.navigate('login');
  }
});

/**
 * ヘッダーの表示/非表示を更新
 * ログイン前はナビゲーションメニューを非表示にする
 */
function updateHeaderVisibility() {
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelectorAll('.nav-link');
  const logoutBtn = document.getElementById('logout-btn');
  
  if (apiClient.isAuthenticated()) {
    // ログイン済み: ナビゲーションメニューを表示
    navLinks.forEach(link => {
      link.style.display = 'inline-block';
    });
    if (logoutBtn) {
      logoutBtn.style.display = 'block';
    }
  } else {
    // 未ログイン: ナビゲーションメニューを非表示
    navLinks.forEach(link => {
      link.style.display = 'none';
    });
    if (logoutBtn) {
      logoutBtn.style.display = 'none';
    }
  }
}

/**
 * 管理者リンクの表示/非表示を更新
 */
function updateAdminLinkVisibility() {
  if (apiClient.isAuthenticated() && apiClient.currentUser) {
    const role = apiClient.currentUser.role;
    const adminLink = document.querySelector('.admin-link');
    if (adminLink && (role === 'Admin' || role === 'Moderator')) {
      adminLink.style.display = 'block';
    } else if (adminLink) {
      adminLink.style.display = 'none';
    }
  }
}

// ユーザー情報更新時にヘッダーと管理者リンクを更新
const originalGetMe = apiClient.getMe.bind(apiClient);
apiClient.getMe = async function() {
  const result = await originalGetMe();
  updateHeaderVisibility();
  updateAdminLinkVisibility();
  return result;
};

const originalLogin = apiClient.login.bind(apiClient);
apiClient.login = async function(email) {
  const result = await originalLogin(email);
  updateHeaderVisibility();
  updateAdminLinkVisibility();
  return result;
};

const originalLogout = apiClient.logout.bind(apiClient);
apiClient.logout = async function() {
  await originalLogout();
  updateHeaderVisibility();
  updateAdminLinkVisibility();
};

