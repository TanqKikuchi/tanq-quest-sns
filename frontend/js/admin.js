/**
 * 管理者機能UI
 */

/**
 * 管理者ページの初期化
 */
async function initAdminPage() {
  // 権限チェック
  if (!apiClient.currentUser) {
    try {
      await apiClient.getMe();
    } catch (error) {
      router.navigate('login');
      return;
    }
  }

  const role = apiClient.currentUser.role;
  if (role !== 'Admin' && role !== 'Moderator') {
    notificationManager.error('管理者権限が必要です');
    router.navigate('community');
    return;
  }

  // 管理者リンクを表示
  const adminLink = document.querySelector('.admin-link');
  if (adminLink) {
    adminLink.style.display = 'block';
  }

  // 管理者のみユーザー管理タブを表示
  if (role === 'Admin') {
    const usersTab = document.getElementById('admin-users-tab');
    if (usersTab) {
      usersTab.style.display = 'block';
    }
  }

  setupAdminTabs();
  await loadMetrics();
}

/**
 * 管理者タブのセットアップ
 */
function setupAdminTabs() {
  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');

      // アクティブ状態を更新
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      const content = document.getElementById(`admin-${tabName}-tab`);
      if (content) {
        content.classList.add('active');
      }

      // タブに応じたデータを読み込む
      switch (tabName) {
        case 'metrics':
          loadMetrics();
          break;
        case 'posts':
          loadAdminPosts();
          break;
        case 'reports':
          loadAdminReports();
          break;
        case 'users':
          if (apiClient.currentUser.role === 'Admin') {
            loadAdminUsers();
          }
          break;
      }
    });
  });
}

/**
 * メトリクスを読み込む
 */
async function loadMetrics() {
  const container = document.getElementById('admin-metrics');
  if (!container) return;

  loadingManager.show('admin-metrics', 'メトリクスを読み込み中...');

  try {
    const weekStart = document.getElementById('metrics-week-start')?.value;
    const weekEnd = document.getElementById('metrics-week-end')?.value;

    const params = {};
    if (weekStart) params.week_start = weekStart;
    if (weekEnd) params.week_end = weekEnd;

    const response = await apiClient.get('api/admin/metrics', params);
    const metrics = response.metrics;

    displayMetrics(metrics);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>メトリクスの読み込みに失敗しました。</p>';
  } finally {
    loadingManager.hide('admin-metrics');
  }
}

/**
 * メトリクスを表示
 */
function displayMetrics(metrics) {
  const container = document.getElementById('admin-metrics');
  if (!container) return;

  const distributionHtml = `
    <div class="metrics-distribution">
      <h3>校舎別分布</h3>
      <div class="distribution-list">
        ${Object.entries(metrics.distribution?.by_school || {}).map(([schoolId, count]) => 
          `<div class="distribution-item"><span>校舎 ${schoolId}:</span><span>${count}件</span></div>`
        ).join('')}
      </div>
      <h3>学年別分布</h3>
      <div class="distribution-list">
        ${Object.entries(metrics.distribution?.by_grade || {}).map(([grade, count]) => 
          `<div class="distribution-item"><span>${grade}年生:</span><span>${count}件</span></div>`
        ).join('')}
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">ユニーク投稿者数</div>
        <div class="metric-value">${metrics.unique_posters || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">アクティブユーザー</div>
        <div class="metric-value">${metrics.active_users || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">投稿数</div>
        <div class="metric-value">${metrics.post_count || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">スタンプ総数</div>
        <div class="metric-value">${metrics.total_stamps || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">平均頑張った度</div>
        <div class="metric-value">${metrics.avg_effort_score || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">平均わくわく度</div>
        <div class="metric-value">${metrics.avg_excitement_score || 0}</div>
      </div>
    </div>
    ${distributionHtml}
  `;

  // メトリクス読み込みボタンのイベント
  const loadBtn = document.getElementById('load-metrics-btn');
  if (loadBtn) {
    loadBtn.onclick = loadMetrics;
  }
}

/**
 * 投稿管理一覧を読み込む
 */
async function loadAdminPosts() {
  const container = document.getElementById('admin-posts-list');
  if (!container) return;

  loadingManager.show('admin-posts-list', '投稿を読み込み中...');

  try {
    const search = document.getElementById('admin-posts-search')?.value;
    const status = document.getElementById('admin-posts-status')?.value;

    const params = { limit: 50 };
    if (search) params.search = search;
    if (status) params.status = status;

    const response = await apiClient.get('api/admin/posts', params);
    const posts = response.posts || [];

    displayAdminPosts(posts);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>投稿の読み込みに失敗しました。</p>';
  } finally {
    loadingManager.hide('admin-posts-list');
  }
}

/**
 * 投稿管理一覧を表示
 */
function displayAdminPosts(posts) {
  const container = document.getElementById('admin-posts-list');
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = '<p>投稿が見つかりませんでした。</p>';
    return;
  }

  container.innerHTML = posts.map(post => `
    <div class="admin-item">
      <div class="admin-item-content">
        <div class="admin-item-header">
          <span class="admin-item-id">ID: ${post.id}</span>
          <span class="admin-item-status">${post.is_public ? '公開' : '非公開'}</span>
        </div>
        <div class="admin-item-title">${post.title || '（タイトルなし）'}</div>
        <div class="admin-item-meta">
          <span>ユーザーID: ${post.user_id}</span>
          <span>作成日: ${new Date(post.created_at).toLocaleString('ja-JP')}</span>
        </div>
      </div>
      <div class="admin-item-actions">
        <button class="btn-admin-delete" data-post-id="${post.id}">削除</button>
        <button class="btn-admin-force-hide" data-post-id="${post.id}" data-is-public="${post.is_public}">
          ${post.is_public ? '強制非公開' : '公開に戻す'}
        </button>
      </div>
    </div>
  `).join('');

  // イベントリスナーを追加
  attachAdminPostListeners();
}

/**
 * 投稿管理のアクションボタンのイベントリスナー
 */
function attachAdminPostListeners() {
  // 削除ボタン
  document.querySelectorAll('.btn-admin-delete').forEach(button => {
    button.addEventListener('click', async (e) => {
      if (!confirm('本当に削除しますか？')) {
        return;
      }

      const postId = button.getAttribute('data-post-id');

      try {
        await apiClient.delete(`api/posts/${postId}`);
        notificationManager.success('投稿を削除しました');
        await loadAdminPosts();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });

  // 強制非公開ボタン
  document.querySelectorAll('.btn-admin-force-hide').forEach(button => {
    button.addEventListener('click', async (e) => {
      const postId = button.getAttribute('data-post-id');
      const isPublic = button.getAttribute('data-is-public') === 'true';

      try {
        await apiClient.patch(`api/admin/posts/${postId}/force-hide`, {
          is_public: !isPublic
        });
        notificationManager.success('投稿の公開状態を変更しました');
        await loadAdminPosts();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

/**
 * 通報管理一覧を読み込む
 */
async function loadAdminReports() {
  const container = document.getElementById('admin-reports-list');
  if (!container) return;

  loadingManager.show('admin-reports-list', '通報を読み込み中...');

  try {
    const status = document.getElementById('admin-reports-status')?.value;

    const params = {};
    if (status) params.status = status;

    const response = await apiClient.get('api/admin/reports', params);
    const reports = response.reports || [];

    displayAdminReports(reports);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>通報の読み込みに失敗しました。</p>';
  } finally {
    loadingManager.hide('admin-reports-list');
  }
}

/**
 * 通報管理一覧を表示
 */
function displayAdminReports(reports) {
  const container = document.getElementById('admin-reports-list');
  if (!container) return;

  if (reports.length === 0) {
    container.innerHTML = '<p>通報が見つかりませんでした。</p>';
    return;
  }

  const statusLabels = {
    pending: '未対応',
    reviewed: '確認済み',
    resolved: '解決済み'
  };

  container.innerHTML = reports.map(report => `
    <div class="admin-item">
      <div class="admin-item-content">
        <div class="admin-item-header">
          <span class="admin-item-id">ID: ${report.id}</span>
          <span class="admin-item-status report-status-${report.status}">${statusLabels[report.status] || report.status}</span>
        </div>
        <div class="admin-item-title">投稿ID: ${report.post_id}</div>
        <div class="admin-item-meta">
          <div>通報理由: ${report.reason}</div>
          <div>通報者ID: ${report.reporter_id}</div>
          <div>作成日: ${new Date(report.created_at).toLocaleString('ja-JP')}</div>
          ${report.handled_by ? `<div>対応者ID: ${report.handled_by}</div>` : ''}
        </div>
      </div>
      <div class="admin-item-actions">
        <select class="admin-report-status-select" data-report-id="${report.id}">
          <option value="pending" ${report.status === 'pending' ? 'selected' : ''}>未対応</option>
          <option value="reviewed" ${report.status === 'reviewed' ? 'selected' : ''}>確認済み</option>
          <option value="resolved" ${report.status === 'resolved' ? 'selected' : ''}>解決済み</option>
        </select>
        <button class="btn-admin-update-report" data-report-id="${report.id}">更新</button>
      </div>
    </div>
  `).join('');

  // イベントリスナーを追加
  attachAdminReportListeners();
}

/**
 * 通報管理のアクションボタンのイベントリスナー
 */
function attachAdminReportListeners() {
  document.querySelectorAll('.btn-admin-update-report').forEach(button => {
    button.addEventListener('click', async (e) => {
      const reportId = button.getAttribute('data-report-id');
      const select = document.querySelector(`.admin-report-status-select[data-report-id="${reportId}"]`);
      const status = select?.value;

      if (!status) return;

      try {
        await apiClient.patch(`api/admin/reports/${reportId}`, {
          status: status,
          handled_by: apiClient.currentUser.id
        });
        notificationManager.success('通報ステータスを更新しました');
        await loadAdminReports();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

/**
 * ユーザー管理一覧を読み込む（管理者のみ）
 */
async function loadAdminUsers() {
  if (apiClient.currentUser.role !== 'Admin') {
    return;
  }

  const container = document.getElementById('admin-users-list');
  if (!container) return;

  loadingManager.show('admin-users-list', 'ユーザーを読み込み中...');

  try {
    const response = await apiClient.get('api/admin/users');
    const users = response.users || [];

    displayAdminUsers(users);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
    container.innerHTML = '<p>ユーザーの読み込みに失敗しました。</p>';
  } finally {
    loadingManager.hide('admin-users-list');
  }
}

/**
 * ユーザー管理一覧を表示
 */
function displayAdminUsers(users) {
  const container = document.getElementById('admin-users-list');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<p>ユーザーが見つかりませんでした。</p>';
    return;
  }

  const statusLabels = {
    active: 'アクティブ',
    frozen: '凍結中'
  };

  container.innerHTML = users.map(user => `
    <div class="admin-item">
      <div class="admin-item-content">
        <div class="admin-item-header">
          <span class="admin-item-id">ID: ${user.id}</span>
          <span class="admin-item-status user-status-${user.status}">${statusLabels[user.status] || user.status}</span>
        </div>
        <div class="admin-item-title">${user.email}</div>
        <div class="admin-item-meta">
          <span>ロール: ${user.role}</span>
          <span>作成日: ${new Date(user.created_at).toLocaleString('ja-JP')}</span>
        </div>
      </div>
      <div class="admin-item-actions">
        <select class="admin-user-status-select" data-user-id="${user.id}">
          <option value="active" ${user.status === 'active' ? 'selected' : ''}>アクティブ</option>
          <option value="frozen" ${user.status === 'frozen' ? 'selected' : ''}>凍結</option>
        </select>
        <button class="btn-admin-update-user" data-user-id="${user.id}">更新</button>
      </div>
    </div>
  `).join('');

  // イベントリスナーを追加
  attachAdminUserListeners();
}

/**
 * ユーザー管理のアクションボタンのイベントリスナー
 */
function attachAdminUserListeners() {
  document.querySelectorAll('.btn-admin-update-user').forEach(button => {
    button.addEventListener('click', async (e) => {
      const userId = button.getAttribute('data-user-id');
      const select = document.querySelector(`.admin-user-status-select[data-user-id="${userId}"]`);
      const status = select?.value;

      if (!status) return;

      if (status === 'frozen' && !confirm('本当にアカウントを凍結しますか？')) {
        return;
      }

      try {
        await apiClient.patch(`api/admin/users/${userId}/status`, {
          status: status
        });
        notificationManager.success('ユーザーステータスを更新しました');
        await loadAdminUsers();
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      }
    });
  });
}

// 検索・フィルタボタンのイベント
document.addEventListener('DOMContentLoaded', () => {
  const postsSearchBtn = document.getElementById('admin-posts-search-btn');
  if (postsSearchBtn) {
    postsSearchBtn.addEventListener('click', loadAdminPosts);
  }

  const reportsLoadBtn = document.getElementById('admin-reports-load-btn');
  if (reportsLoadBtn) {
    reportsLoadBtn.addEventListener('click', loadAdminReports);
  }
});

