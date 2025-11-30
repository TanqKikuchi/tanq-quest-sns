/**
 * 投稿編集機能
 */

let editingPost = null;

/**
 * 投稿編集画面を表示
 */
async function showEditPost(postId) {
  try {
    loadingManager.show('main-content', '投稿を読み込み中...');

    // 投稿データを取得
    const response = await apiClient.get(`api/posts/${postId}`);
    editingPost = response.post;

    // 編集画面に遷移
    router.navigate('post-edit');
    displayEditForm(editingPost);
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
  } finally {
    loadingManager.hide('main-content');
  }
}

/**
 * 編集フォームを表示
 */
function displayEditForm(post) {
  const container = document.getElementById('post-edit-page');
  if (!container) {
    // 編集ページが存在しない場合は作成
    createEditPage();
  }

  // フォームに値を設定
  const titleInput = document.getElementById('edit-post-title');
  const effortSlider = document.getElementById('edit-post-effort');
  const excitementSlider = document.getElementById('edit-post-excitement');
  const allowPromotionCheckbox = document.getElementById('edit-post-allow-promotion');
  const effortValue = document.getElementById('edit-effort-value');
  const excitementValue = document.getElementById('edit-excitement-value');

  if (titleInput) titleInput.value = post.title || '';
  if (effortSlider) {
    effortSlider.value = post.effort_score || 3;
    if (effortValue) effortValue.textContent = post.effort_score || 3;
  }
  if (excitementSlider) {
    excitementSlider.value = post.excitement_score || 3;
    if (excitementValue) excitementValue.textContent = post.excitement_score || 3;
  }
  if (allowPromotionCheckbox) {
    allowPromotionCheckbox.checked = post.allow_promotion || false;
  }

  // 画像プレビューを表示
  displayEditImagePreview(post.image_urls || []);

  // ページを表示
  document.getElementById('post-page').classList.remove('active');
  document.getElementById('post-edit-page').classList.add('active');
}

/**
 * 編集ページを作成
 */
function createEditPage() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const editPageHtml = `
    <div id="post-edit-page" class="page">
      <div class="post-container">
        <h2>投稿を編集</h2>
        <form id="post-edit-form">
          <div class="form-group">
            <label>画像（現在の画像）</label>
            <div id="edit-image-preview" class="image-preview"></div>
            <p class="form-note">※ 画像の変更は現在サポートされていません</p>
          </div>
          <div class="form-group">
            <label for="edit-post-title">タイトル or 一言（任意）</label>
            <input type="text" id="edit-post-title" name="title" placeholder="タイトルを入力">
          </div>
          <div class="form-group">
            <label for="edit-post-effort">頑張った度（💪1〜5）</label>
            <input type="range" id="edit-post-effort" name="effort_score" min="1" max="5" value="3" required>
            <span id="edit-effort-value">3</span>
          </div>
          <div class="form-group">
            <label for="edit-post-excitement">わくわく度（⭐️1〜5）</label>
            <input type="range" id="edit-post-excitement" name="excitement_score" min="1" max="5" value="3" required>
            <span id="edit-excitement-value">3</span>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" id="edit-post-allow-promotion" name="allow_promotion">
              HP/広告掲載許諾（任意）
            </label>
          </div>
          <div class="button-group">
            <button type="submit" class="btn-primary">更新</button>
            <button type="button" id="edit-post-cancel" class="btn-secondary">キャンセル</button>
          </div>
        </form>
      </div>
    </div>
  `;

  mainContent.insertAdjacentHTML('beforeend', editPageHtml);

  // イベントリスナーを設定
  setupEditForm();
}

/**
 * 編集フォームのセットアップ
 */
function setupEditForm() {
  const form = document.getElementById('post-edit-form');
  const cancelBtn = document.getElementById('edit-post-cancel');
  const effortSlider = document.getElementById('edit-post-effort');
  const excitementSlider = document.getElementById('edit-post-excitement');
  const effortValue = document.getElementById('edit-effort-value');
  const excitementValue = document.getElementById('edit-excitement-value');

  // フォーム送信
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await submitEdit();
    });
  }

  // キャンセルボタン
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      router.navigate('profile');
    });
  }

  // スライダーの値表示
  if (effortSlider && effortValue) {
    effortSlider.addEventListener('input', (e) => {
      effortValue.textContent = e.target.value;
    });
  }

  if (excitementSlider && excitementValue) {
    excitementSlider.addEventListener('input', (e) => {
      excitementValue.textContent = e.target.value;
    });
  }
}

/**
 * 編集した投稿を送信
 */
async function submitEdit() {
  if (!editingPost) return;

  const form = document.getElementById('post-edit-form');
  if (!form) return;

  const formData = new FormData(form);

  try {
    loadingManager.show('post-edit-page', '更新中...');

    const postData = {
      title: formData.get('title') || '',
      effort_score: parseInt(formData.get('effort_score')),
      excitement_score: parseInt(formData.get('excitement_score')),
      allow_promotion: formData.get('allow_promotion') === 'on'
    };

    await apiClient.put(`api/posts/${editingPost.id}`, postData);
    notificationManager.success('投稿を更新しました');
    router.navigate('profile');
  } catch (error) {
    // エラーは既にerrorHandlerで処理されている
  } finally {
    loadingManager.hide('post-edit-page');
  }
}

/**
 * 編集用の画像プレビューを表示
 */
function displayEditImagePreview(imageUrls) {
  const container = document.getElementById('edit-image-preview');
  if (!container) return;

  if (!imageUrls || imageUrls.length === 0) {
    container.innerHTML = '<p>画像はありません</p>';
    return;
  }

  container.innerHTML = imageUrls.map((url, index) => `
    <div class="image-preview-item">
      <img src="${url}" alt="画像${index + 1}">
    </div>
  `).join('');
}

