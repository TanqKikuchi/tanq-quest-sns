/**
 * フォロー機能UI
 */

let followingUsers = new Set(); // フォロー中のユーザーIDセット

/**
 * フォロー機能の初期化
 */
async function initFollow() {
  await loadFollowingUsers();
}

/**
 * フォロー中のユーザー一覧を読み込む
 */
async function loadFollowingUsers() {
  if (!apiClient.isAuthenticated()) {
    return;
  }

  try {
    const response = await apiClient.get('api/follows');
    const follows = response.follows || [];
    followingUsers = new Set(follows.map(f => f.followee_id));
  } catch (error) {
    console.error('Load following users error:', error);
    // エラーは既にerrorHandlerで処理されている
  }
}

/**
 * ユーザーをフォロー
 */
async function followUser(followeeId) {
  if (!apiClient.isAuthenticated()) {
    notificationManager.error('ログインが必要です');
    return false;
  }

  if (apiClient.currentUser.id === followeeId) {
    notificationManager.error('自分自身をフォローすることはできません');
    return false;
  }

  try {
    await apiClient.post('api/follows', {
      followee_id: followeeId
    });
    
    followingUsers.add(followeeId);
    notificationManager.success('フォローしました');
    return true;
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    return false;
  }
}

/**
 * ユーザーのフォローを解除
 */
async function unfollowUser(followeeId) {
  if (!apiClient.isAuthenticated()) {
    notificationManager.error('ログインが必要です');
    return false;
  }

  try {
    await apiClient.delete(`api/follows/${followeeId}`);
    
    followingUsers.delete(followeeId);
    notificationManager.success('フォローを解除しました');
    return true;
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    return false;
  }
}

/**
 * フォロー状態をチェック
 */
function isFollowing(userId) {
  return followingUsers.has(userId);
}

/**
 * フォローボタンのHTMLを生成
 */
function createFollowButton(userId, nickname) {
  const isFollowingUser = isFollowing(userId);
  const buttonText = isFollowingUser ? 'フォロー中' : 'フォロー';
  const buttonClass = isFollowingUser ? 'btn-follow active' : 'btn-follow';
  
  return `
    <button class="${buttonClass}" data-user-id="${userId}" data-user-nickname="${nickname || 'ユーザー'}">
      ${buttonText}
    </button>
  `;
}

/**
 * フォローボタンのイベントリスナーを追加
 */
function attachFollowButtonListeners(container) {
  if (!container) return;

  container.querySelectorAll('.btn-follow').forEach(button => {
    // 既存のイベントリスナーを削除（重複防止）
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const userId = newButton.getAttribute('data-user-id');
      const isFollowingUser = isFollowing(userId);

      // ローディング表示
      newButton.disabled = true;
      newButton.textContent = '処理中...';

      try {
        if (isFollowingUser) {
          await unfollowUser(userId);
        } else {
          await followUser(userId);
        }

        // ボタンの状態を更新
        updateFollowButton(newButton, userId);
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      } finally {
        newButton.disabled = false;
      }
    });
  });
}

/**
 * フォローボタンの状態を更新
 */
function updateFollowButton(button, userId) {
  const isFollowingUser = isFollowing(userId);
  const buttonText = isFollowingUser ? 'フォロー中' : 'フォロー';
  
  if (isFollowingUser) {
    button.classList.add('active');
  } else {
    button.classList.remove('active');
  }
  button.textContent = buttonText;
}

/**
 * フォロー一覧を表示
 */
async function displayFollowList(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  loadingManager.show(containerId, 'フォロー一覧を読み込み中...');

  try {
    const response = await apiClient.get('api/follows');
    const follows = response.follows || [];

    if (follows.length === 0) {
      container.innerHTML = '<p>フォローしているユーザーはいません。</p>';
      return;
    }

    const followListHtml = `
      <div class="follow-list">
        ${follows.map(follow => `
          <div class="follow-item">
            <div class="follow-user-info">
              <span class="follow-user-nickname">${follow.followee?.nickname || 'ユーザー'}</span>
              <span class="follow-user-grade">${follow.followee?.grade ? `${follow.followee.grade}年生` : ''}</span>
              ${follow.followee?.school ? `<span class="follow-user-school">${follow.followee.school}</span>` : ''}
            </div>
            <button class="btn-unfollow" data-user-id="${follow.followee_id}">フォロー解除</button>
          </div>
        `).join('')}
      </div>
    `;

    container.innerHTML = followListHtml;

    // フォロー解除ボタンのイベントリスナー
    container.querySelectorAll('.btn-unfollow').forEach(button => {
      button.addEventListener('click', async (e) => {
        const userId = button.getAttribute('data-user-id');
        
        button.disabled = true;
        button.textContent = '処理中...';

        try {
          await unfollowUser(userId);
          // フォロー一覧を再読み込み
          await displayFollowList(containerId);
        } catch (error) {
          // エラーは既にerrorHandlerで処理されている
        } finally {
          button.disabled = false;
        }
      });
    });
  } catch (error) {
    container.innerHTML = '<p>フォロー一覧の読み込みに失敗しました。</p>';
  } finally {
    loadingManager.hide(containerId);
  }
}

