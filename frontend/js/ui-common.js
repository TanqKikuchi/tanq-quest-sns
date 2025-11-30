/**
 * 共通UIコンポーネント
 * ローディング、エラー表示、通知などの共通機能
 */

/**
 * ローディング管理クラス
 */
class LoadingManager {
  constructor() {
    this.loadingElements = new Map();
  }

  /**
   * ローディングを表示
   */
  show(containerId, message = '読み込み中...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 既存のローディングを削除
    const existing = container.querySelector('.loading-overlay');
    if (existing) {
      existing.remove();
    }

    // ローディング要素を作成
    const loadingHtml = `
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', loadingHtml);
    this.loadingElements.set(containerId, container.querySelector('.loading-overlay'));
  }

  /**
   * ローディングを非表示
   */
  hide(containerId) {
    const loading = this.loadingElements.get(containerId);
    if (loading) {
      loading.remove();
      this.loadingElements.delete(containerId);
    }
  }

  /**
   * すべてのローディングを非表示
   */
  hideAll() {
    this.loadingElements.forEach((loading, containerId) => {
      loading.remove();
    });
    this.loadingElements.clear();
  }
}

/**
 * 通知管理クラス
 */
class NotificationManager {
  constructor() {
    this.notificationContainer = null;
    this.init();
  }

  init() {
    // 通知コンテナを作成
    if (!document.getElementById('notification-container')) {
      const container = document.createElement('div');
      container.id = 'notification-container';
      container.className = 'notification-container';
      document.body.appendChild(container);
      this.notificationContainer = container;
    } else {
      this.notificationContainer = document.getElementById('notification-container');
    }
  }

  /**
   * 通知を表示
   */
  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    this.notificationContainer.appendChild(notification);

    // アニメーション
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // 自動削除
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);

    return notification;
  }

  /**
   * 成功メッセージ
   */
  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  /**
   * エラーメッセージ
   */
  error(message, duration) {
    return this.show(message, 'error', duration || 5000);
  }

  /**
   * 情報メッセージ
   */
  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

/**
 * エラーハンドラー
 */
class ErrorHandler {
  constructor(notificationManager) {
    this.notification = notificationManager;
  }

  /**
   * エラーを処理してユーザーフレンドリーなメッセージを表示
   */
  handle(error, context = '') {
    console.error(`Error in ${context}:`, error);

    let message = 'エラーが発生しました';

    if (error.message) {
      // APIエラーの場合
      if (error.message.includes('UNAUTHORIZED')) {
        message = 'ログインが必要です';
      } else if (error.message.includes('FORBIDDEN')) {
        message = '権限がありません';
      } else if (error.message.includes('NOT_FOUND')) {
        message = '見つかりませんでした';
      } else if (error.message.includes('VALIDATION_ERROR')) {
        message = error.message.replace('VALIDATION_ERROR: ', '');
      } else if (error.message.includes('DUPLICATE_ERROR')) {
        message = error.message.replace('DUPLICATE_ERROR: ', '');
      } else if (error.message.includes('LIMIT_EXCEEDED')) {
        message = error.message.replace('LIMIT_EXCEEDED: ', '');
      } else if (error.message.includes('Network')) {
        message = 'ネットワークエラーが発生しました。接続を確認してください。';
      } else {
        message = error.message;
      }
    }

    this.notification.error(message);
    return message;
  }
}

// グローバルインスタンス
const loadingManager = new LoadingManager();
const notificationManager = new NotificationManager();
const errorHandler = new ErrorHandler(notificationManager);

