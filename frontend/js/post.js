/**
 * 投稿画面
 */

let selectedImages = [];
let selectedQuest = null;
let quests = [];

/**
 * 投稿ページの初期化
 */
async function initPostPage() {
  await loadQuests();
  setupPostForm();
  setupImagePreview();
  setupScoreSliders();
}

/**
 * クエスト一覧を読み込む
 */
async function loadQuests() {
  try {
    const response = await apiClient.get('api/quests');
    quests = response.quests || [];
    populateQuestSelect(quests);
  } catch (error) {
    console.error('Load quests error:', error);
  }
}

/**
 * クエスト選択ドロップダウンを設定
 */
function populateQuestSelect(quests) {
  const select = document.getElementById('post-quest');
  if (!select) return;

  select.innerHTML = '<option value="">クエストを選択</option>';
  quests.forEach(quest => {
    const option = document.createElement('option');
    option.value = quest.id;
    option.textContent = quest.title;
    select.appendChild(option);
  });
}

/**
 * 投稿フォームのセットアップ
 */
function setupPostForm() {
  const form = document.getElementById('post-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showConfirmPage();
  });
}

/**
 * 画像プレビューのセットアップ
 */
function setupImagePreview() {
  const fileInput = document.getElementById('post-images');
  if (!fileInput) return;

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    selectedImages = files;
    displayImagePreview(files);
  });
}

/**
 * 画像プレビューを表示
 */
function displayImagePreview(files) {
  const container = document.getElementById('image-preview');
  if (!container) return;

  container.innerHTML = '';

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'image-preview-item';
      div.innerHTML = `
        <img src="${e.target.result}" alt="プレビュー${index + 1}">
        <button type="button" class="remove-image" data-index="${index}">×</button>
      `;
      container.appendChild(div);

      // 削除ボタンのイベントリスナー
      div.querySelector('.remove-image').addEventListener('click', () => {
        removeImage(index);
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 画像を削除
 */
function removeImage(index) {
  selectedImages.splice(index, 1);
  displayImagePreview(selectedImages);
  
  // ファイル入力も更新
  const fileInput = document.getElementById('post-images');
  if (fileInput) {
    const dt = new DataTransfer();
    selectedImages.forEach(file => dt.items.add(file));
    fileInput.files = dt.files;
  }
}

/**
 * スコアスライダーのセットアップ
 */
function setupScoreSliders() {
  const effortSlider = document.getElementById('post-effort');
  const excitementSlider = document.getElementById('post-excitement');
  const effortValue = document.getElementById('effort-value');
  const excitementValue = document.getElementById('excitement-value');

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
 * 確認画面を表示
 */
function showConfirmPage() {
  const form = document.getElementById('post-form');
  if (!form) return;

  const formData = new FormData(form);
  const confirmContent = document.getElementById('post-confirm-content');
  if (!confirmContent) return;

  // 確認内容を生成
  let html = '<div class="confirm-content">';
  
  if (selectedImages.length > 0) {
    html += '<h3>画像</h3><div class="confirm-images">';
    // 画像は非同期で読み込まれるため、プレースホルダーを表示
    html += '<p>画像 ' + selectedImages.length + ' 枚が選択されています</p>';
    html += '</div>';
  }

  const questId = formData.get('quest_id');
  const selectedQuestObj = quests.find(q => q.id === questId);
  if (selectedQuestObj) {
    html += `<p><strong>クエスト:</strong> ${selectedQuestObj.title}</p>`;
  }

  html += `<p><strong>タイトル:</strong> ${formData.get('title') || '（なし）'}</p>`;
  html += `<p><strong>頑張った度:</strong> ${formData.get('effort_score')} / 5</p>`;
  html += `<p><strong>わくわく度:</strong> ${formData.get('excitement_score')} / 5</p>`;
  html += `<p><strong>HP/広告掲載許諾:</strong> ${formData.get('allow_promotion') ? '許可' : '不許可'}</p>`;
  html += '</div>';

  confirmContent.innerHTML = html;

  // 確認画面を表示
  document.getElementById('post-page').classList.remove('active');
  document.getElementById('post-confirm-page').classList.add('active');

  // 確認画面のボタンイベント
  setupConfirmButtons(formData);
}

/**
 * 確認画面のボタンをセットアップ
 */
function setupConfirmButtons(formData) {
  const submitBtn = document.getElementById('post-confirm-submit');
  const backBtn = document.getElementById('post-confirm-back');

  if (submitBtn) {
    submitBtn.onclick = async () => {
      try {
        loadingManager.show('post-confirm-content', '投稿中...');
        await submitPost(formData);
        notificationManager.success('投稿が完了しました！');
        router.navigate('community');
      } catch (error) {
        // エラーは既にerrorHandlerで処理されている
      } finally {
        loadingManager.hide('post-confirm-content');
      }
    };
  }

  if (backBtn) {
    backBtn.onclick = () => {
      document.getElementById('post-confirm-page').classList.remove('active');
      document.getElementById('post-page').classList.add('active');
    };
  }
}

/**
 * 投稿を送信
 */
async function submitPost(formData) {
  // 画像をアップロード
  let imageUrls = [];
  if (selectedImages.length > 0) {
    imageUrls = await uploadImages(selectedImages);
  }

  const postData = {
    quest_id: formData.get('quest_id'),
    title: formData.get('title') || '',
    body: '',
    image_urls: imageUrls,
    effort_score: parseInt(formData.get('effort_score')),
    excitement_score: parseInt(formData.get('excitement_score')),
    allow_promotion: formData.get('allow_promotion') === 'on'
  };

  await apiClient.post('api/posts', postData);
}

/**
 * 画像をアップロード（Google Drive API使用）
 */
async function uploadImages(files) {
  if (!files || files.length === 0) {
    return [];
  }

  // 画像をBase64エンコード
  const imagePromises = Array.from(files).map(async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          data: e.target.result,
          filename: file.name,
          mime_type: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  });

  const images = await Promise.all(imagePromises);

  // 複数画像を一括アップロード
  const response = await apiClient.post('api/images/upload-multiple', {
    images: images
  });

  return response.image_urls || [];
}

