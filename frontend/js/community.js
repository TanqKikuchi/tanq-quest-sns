/**
 * コミュニティタイムライン画面
 */

let currentFilter = 'all';
let currentSort = 'newest';
let filterValue = null;

/**
 * コミュニティページの初期化
 */
async function initCommunityPage() {
  setupFilterTabs();
  setupSortSelect();
  await initFollow(); // フォロー機能の初期化
  await loadCommunityTimeline();
}

/**
 * フィルタタブのセットアップ
 */
function setupFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      // アクティブ状態を更新
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      currentFilter = tab.getAttribute('data-filter');
      filterValue = null;

      // フィルタ値の入力が必要な場合は実装
      loadCommunityTimeline();
    });
  });
}

/**
 * ソート選択のセットアップ
 */
function setupSortSelect() {
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadCommunityTimeline();
    });
  }
}

/**
 * コミュニティタイムラインを読み込む
 */
async function loadCommunityTimeline() {
  const container = document.getElementById('community-timeline');
  if (!container) return;

  loadingManager.show('community-timeline', '投稿を読み込み中...');

  try {
    const params = {
      filter: currentFilter,
      sort: currentSort,
      limit: 20
    };

    if (filterValue) {
      params.filter_value = filterValue;
    }

    const response = await apiClient.get('api/posts', params);
    const posts = response.posts || [];
    displayCommunityTimeline(posts);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>投稿の読み込みに失敗しました。</p>';
  } finally {
    loadingManager.hide('community-timeline');
  }
}

/**
 * コミュニティタイムラインを表示
 */
function displayCommunityTimeline(posts) {
  const container = document.getElementById('community-timeline');
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p>投稿が見つかりませんでした。</p>';
    return;
  }

  container.innerHTML = posts.map(post => createPostCard(post)).join('');
  
  // スタンプボタンのイベントリスナーを追加
  attachStampListeners();
  
  // フォローボタンのイベントリスナーを追加
  attachFollowButtonListeners(container);
  
  // 通報ボタンのイベントリスナーを追加
  attachReportListeners(container);
}

/**
 * 投稿カードHTMLを生成（quest.jsと同じ）
 */
function createPostCard(post) {
  const imageHtml = post.image_urls && post.image_urls.length > 0
    ? `<img src="${post.image_urls[0]}" alt="投稿画像" class="post-card-image">`
    : '';

  // フォローボタン（自分以外のユーザーの投稿に表示）
  const followButtonHtml = (post.user_id && post.user_id !== apiClient.currentUser?.id && typeof createFollowButton === 'function')
    ? createFollowButton(post.user_id, post.user?.nickname)
    : '';

  const stampsHtml = `
    <div class="post-card-stamps">
      <button class="stamp-button ${post.my_stamp === 'clap' ? 'active' : ''}" 
              data-post-id="${post.id}" data-stamp-type="clap">
        👏 <span class="stamp-count">${post.stamps?.clap || 0}</span>
      </button>
      <button class="stamp-button ${post.my_stamp === 'heart' ? 'active' : ''}" 
              data-post-id="${post.id}" data-stamp-type="heart">
        ❤️ <span class="stamp-count">${post.stamps?.heart || 0}</span>
      </button>
      <button class="stamp-button ${post.my_stamp === 'eye' ? 'active' : ''}" 
              data-post-id="${post.id}" data-stamp-type="eye">
        👀 <span class="stamp-count">${post.stamps?.eye || 0}</span>
      </button>
    </div>
  `;

  // 通報ボタン（自分の投稿以外）
  const reportButtonHtml = (post.user_id && post.user_id !== apiClient.currentUser?.id)
    ? `<button class="btn-report" data-post-id="${post.id}">🚨 通報</button>`
    : '';

  return `
    <div class="post-card">
      ${imageHtml}
      <div class="post-card-content">
        <div class="post-card-header">
          <div class="post-card-user-info">
            <span class="post-card-user">${post.user?.nickname || 'ユーザー'}</span>
            <span class="post-card-level">Lv.${post.user?.level || 1}</span>
          </div>
          ${followButtonHtml}
        </div>
        <div class="post-card-quest">${post.quest?.title || ''}</div>
        ${post.title ? `<div class="post-card-title">${post.title}</div>` : ''}
        ${stampsHtml}
        ${reportButtonHtml ? `<div class="post-card-actions">${reportButtonHtml}</div>` : ''}
      </div>
    </div>
  `;
}

/**
 * スタンプボタンのイベントリスナーを追加
 */
function attachStampListeners() {
  document.querySelectorAll('.stamp-button').forEach(button => {
    button.addEventListener('click', async (e) => {
      const postId = button.getAttribute('data-post-id');
      const stampType = button.getAttribute('data-stamp-type');

      try {
        await apiClient.post(`api/posts/${postId}/stamps`, {
          stamp_type: stampType
        });
        notificationManager.success('スタンプを更新しました');
        // タイムラインを再読み込み
        await loadCommunityTimeline();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

/**
 * 通報ボタンのイベントリスナーを追加
 */
function attachReportListeners(container) {
  if (!container) return;

  container.querySelectorAll('.btn-report').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const postId = button.getAttribute('data-post-id');
      const reason = prompt('通報理由を入力してください:');
      
      if (!reason || reason.trim() === '') {
        return;
      }

      try {
        await apiClient.post('api/admin/reports', {
          post_id: postId,
          reason: reason.trim()
        });
        notificationManager.success('通報を受け付けました');
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

