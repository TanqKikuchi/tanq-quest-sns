/**
 * メインスクリプト
 * アプリケーションの初期化
 */

// APIベースURLの設定
// 本番環境では、GAS Web AppsのデプロイURLを設定
// 例: apiClient.baseUrl = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';

// 開発環境での設定（必要に応じて変更）
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // ローカル開発環境
  // apiClient.baseUrl = 'http://localhost:8080';
} else {
  // 本番環境
  apiClient.baseUrl = 'https://script.google.com/macros/s/AKfycbwBz_jGdch1PLirq0fWWiABbdN2zSBi7P2i8PwbxIa-gMGnt0YTQ1lg_UyolKIcKqu9/exec';
}

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', () => {
  console.log('SNS App initialized');
  
  // セッションを復元
  apiClient.restoreSession();
  
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
 * 管理者リンクの表示/非表示を更新
 */
function updateAdminLinkVisibility() {
  if (apiClient.isAuthenticated() && apiClient.currentUser) {
    const role = apiClient.currentUser.role;
    const adminLink = document.querySelector('.admin-link');
    if (adminLink && (role === 'Admin' || role === 'Moderator')) {
      adminLink.style.display = 'block';
    }
  }
}

// ユーザー情報更新時に管理者リンクを更新
const originalGetMe = apiClient.getMe.bind(apiClient);
apiClient.getMe = async function() {
  const result = await originalGetMe();
  updateAdminLinkVisibility();
  return result;
};

const originalLogin = apiClient.login.bind(apiClient);
apiClient.login = async function(email) {
  const result = await originalLogin(email);
  updateAdminLinkVisibility();
  return result;
};

