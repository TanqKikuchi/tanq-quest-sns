/**
 * マイページ画面
 */

/**
 * プロフィールページの初期化
 */
async function initProfilePage() {
  await initFollow(); // フォロー機能の初期化
  await loadProfile();
  await displayFollowList('profile-follows'); // フォロー一覧を表示
  await loadMyPosts();
}

/**
 * プロフィール情報を読み込む
 */
async function loadProfile() {
  if (!apiClient.currentUser) {
    try {
      await apiClient.getMe();
    } catch (error) {
      // エラーは既にerrorHandlerで処理されている
      return;
    }
  }

  loadingManager.show('profile-info', 'プロフィールを読み込み中...');

  try {
    const response = await apiClient.get(`api/profiles/${apiClient.currentUser.id}`);
    const profile = response.profile;
    displayProfile(profile);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
  } finally {
    loadingManager.hide('profile-info');
  }
}

/**
 * プロフィール情報を表示
 */
function displayProfile(profile) {
  const container = document.getElementById('profile-info');
  if (!container) return;

  const badgesHtml = profile.badges && profile.badges.length > 0
    ? `<div class="badges-list">${profile.badges.map(badge => 
        `<span class="badge-item">${badge.name}</span>`
      ).join('')}</div>`
    : '<p>バッジはまだありません。</p>';

  container.innerHTML = `
    <div class="profile-info">
      <div class="profile-info-item">
        <span class="profile-info-label">ニックネーム</span>
        <span class="profile-info-value">${profile.nickname || ''}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">学年</span>
        <span class="profile-info-value">${profile.grade || ''}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">クラス</span>
        <span class="profile-info-value">${profile.class?.name || '（未設定）'}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">校舎</span>
        <span class="profile-info-value">${profile.school?.name || ''}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">レベル</span>
        <span class="profile-info-value">${profile.level || 1}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">完了章</span>
        <span class="profile-info-value">${profile.completed_chapter || 0}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">投稿数</span>
        <span class="profile-info-value">${profile.post_count || 0}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">スタンプ総数</span>
        <span class="profile-info-value">${profile.total_stamps || 0}</span>
      </div>
      <div class="profile-info-item">
        <span class="profile-info-label">フォロー数</span>
        <span class="profile-info-value">${profile.follow_count || 0}</span>
      </div>
    </div>
    ${profile.greeting ? `<p><strong>一言挨拶:</strong> ${profile.greeting}</p>` : ''}
    <div>
      <h3>実績バッジ</h3>
      ${badgesHtml}
    </div>
  `;
}

/**
 * 自分の投稿一覧を読み込む
 */
async function loadMyPosts() {
  loadingManager.show('profile-posts', '投稿を読み込み中...');

  try {
    const response = await apiClient.get('api/posts/my');
    const posts = response.posts || [];
    displayMyPosts(posts);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
  } finally {
    loadingManager.hide('profile-posts');
  }
}

/**
 * 自分の投稿一覧を表示
 */
function displayMyPosts(posts) {
  const container = document.getElementById('profile-posts');
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p>まだ投稿がありません。</p>';
    return;
  }

  container.innerHTML = posts.map(post => createMyPostCard(post)).join('');
  
  // 編集・削除ボタンのイベントリスナーを追加
  attachPostActionListeners();
}

/**
 * 自分の投稿カードHTMLを生成
 */
function createMyPostCard(post) {
  const imageHtml = post.image_urls && post.image_urls.length > 0
    ? `<img src="${post.image_urls[0]}" alt="投稿画像" class="post-card-image">`
    : '';

  const publicStatus = post.is_public ? '公開' : '非公開';

  return `
    <div class="post-card">
      ${imageHtml}
      <div class="post-card-content">
        <div class="post-card-header">
          <span class="post-card-quest">${post.quest?.title || ''}</span>
          <span class="post-status">${publicStatus}</span>
        </div>
        ${post.title ? `<div class="post-card-title">${post.title}</div>` : ''}
        <div class="post-actions">
          <button class="btn-edit" data-post-id="${post.id}">編集</button>
          <button class="btn-toggle-visibility" data-post-id="${post.id}" data-is-public="${post.is_public}">
            ${post.is_public ? '非公開にする' : '公開する'}
          </button>
          <button class="btn-delete" data-post-id="${post.id}">削除</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * 投稿アクションボタンのイベントリスナーを追加
 */
function attachPostActionListeners() {
  // 編集ボタン
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', (e) => {
      const postId = button.getAttribute('data-post-id');
      if (typeof showEditPost === 'function') {
        showEditPost(postId);
      }
    });
  });

  // 公開/非公開切替
  document.querySelectorAll('.btn-toggle-visibility').forEach(button => {
    button.addEventListener('click', async (e) => {
      const postId = button.getAttribute('data-post-id');
      const isPublic = button.getAttribute('data-is-public') === 'true';

      try {
        await apiClient.patch(`api/posts/${postId}/visibility`, {
          is_public: !isPublic
        });
        notificationManager.success('公開状態を変更しました');
        await loadMyPosts();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });

  // 削除ボタン
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', async (e) => {
      if (!confirm('本当に削除しますか？')) {
        return;
      }

      const postId = button.getAttribute('data-post-id');

      try {
        await apiClient.delete(`api/posts/${postId}`);
        notificationManager.success('投稿を削除しました');
        await loadMyPosts();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

