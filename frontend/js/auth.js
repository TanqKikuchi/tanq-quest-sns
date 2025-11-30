/**
 * 認証管理
 */

// ログインフォームの処理
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const loginError = document.getElementById('login-error');
  const logoutBtn = document.getElementById('logout-btn');

  // セッションを復元
  apiClient.restoreSession();

  // 認証状態をチェック
  if (apiClient.isAuthenticated()) {
    checkWelcomePage();
  } else {
    router.navigate('login');
  }

  // ログインフォーム送信
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.textContent = '';

      const email = document.getElementById('email').value;

      try {
        loadingManager.show('login-page', 'ログイン中...');
        await apiClient.login(email);
        notificationManager.success('ログインしました');
        checkWelcomePage();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
        if (error.message) {
          loginError.textContent = error.message;
        }
      } finally {
        loadingManager.hide('login-page');
      }
    });
  }

  // ログアウト
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await apiClient.logout();
        router.navigate('login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    });
  }
});

/**
 * 初回画面（章受講確認）のチェック
 */
async function checkWelcomePage() {
  if (!apiClient.currentProfile) {
    try {
      await apiClient.getMe();
    } catch (error) {
      console.error('Get me error:', error);
      router.navigate('login');
      return;
    }
  }

  // completed_chapterが0または未設定の場合は初回画面を表示
  if (!apiClient.currentProfile || !apiClient.currentProfile.completed_chapter) {
    router.showPage('welcome-page');
    setupWelcomePage();
  } else {
    // 通常のページへ
    const hash = window.location.hash.slice(1);
    router.navigate(hash || 'quest');
  }
}

/**
 * 初回画面のセットアップ
 */
function setupWelcomePage() {
  const yesBtn = document.getElementById('yes-chapter-btn');
  const noBtn = document.getElementById('no-chapter-btn');

  if (yesBtn) {
    yesBtn.addEventListener('click', async () => {
      // completed_chapterを1に設定（実際の章番号は後で実装）
      try {
        await apiClient.put('api/profiles/me', {
          completed_chapter: 1
        });
        await apiClient.getMe();
        router.navigate('quest');
      } catch (error) {
        console.error('Update profile error:', error);
      }
    });
  }

  if (noBtn) {
    noBtn.addEventListener('click', async () => {
      // completed_chapterを0のまま
      try {
        await apiClient.put('api/profiles/me', {
          completed_chapter: 0
        });
        await apiClient.getMe();
        router.navigate('quest');
      } catch (error) {
        console.error('Update profile error:', error);
      }
    });
  }
}

