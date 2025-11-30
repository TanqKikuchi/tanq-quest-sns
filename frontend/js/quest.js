/**
 * クエストポータル画面
 */

let currentQuest = null;
let questPosts = [];

/**
 * クエストページの初期化
 */
async function initQuestPage() {
  await initFollow(); // フォロー機能の初期化
  await loadCurrentQuest();
  await loadQuestTimeline();
}

/**
 * 今週のクエストを読み込む
 */
async function loadCurrentQuest() {
  const container = document.getElementById('current-quest');
  if (!container) return;

  try {
    const response = await apiClient.get('api/quests/current');
    currentQuest = response.quest;
    displayCurrentQuest(currentQuest);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>今週のクエストが見つかりませんでした。</p>';
  }
}

/**
 * 今週のクエストを表示
 */
function displayCurrentQuest(quest) {
  const container = document.getElementById('current-quest');
  if (!container || !quest) return;

  const imageHtml = quest.image_url ? `<img src="${quest.image_url}" alt="${quest.title}">` : '';
  
  container.innerHTML = `
    <h3>${quest.title}</h3>
    <p>${quest.description || ''}</p>
    <div class="quest-meta">
      <span>対象章: ${quest.chapter}</span>
      <span>期間: ${quest.week_start} 〜 ${quest.week_end}</span>
    </div>
    ${imageHtml}
  `;
}

/**
 * クエスト投稿タイムラインを読み込む
 */
async function loadQuestTimeline() {
  if (!currentQuest) {
    await loadCurrentQuest();
  }

  if (!currentQuest) return;

  const container = document.getElementById('quest-timeline');
  if (!container) return;

  loadingManager.show('quest-timeline', '投稿を読み込み中...');

  try {
    const response = await apiClient.get(`api/posts/quest/${currentQuest.id}`);
    questPosts = response.posts || [];
    displayQuestTimeline(questPosts);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>投稿が見つかりませんでした。</p>';
  } finally {
    loadingManager.hide('quest-timeline');
  }
}

/**
 * クエスト投稿タイムラインを表示
 */
function displayQuestTimeline(posts) {
  const container = document.getElementById('quest-timeline');
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p>まだ投稿がありません。</p>';
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

/**
 * 投稿カードHTMLを生成
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
        await loadQuestTimeline();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

