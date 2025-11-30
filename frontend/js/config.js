/**
 * フロントエンド共通設定
 * 
 * APIベースURLなどの環境依存設定をここで一元管理します。
 */
(function() {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  const config = window.APP_CONFIG || {};

  // 既に外部で設定済みでなければ、ここでデフォルトを適用
  if (!config.API_BASE_URL) {
    if (isLocal) {
      // 必要に応じてローカル開発用URLを設定してください
      // 例: config.API_BASE_URL = 'http://localhost:8080';
      config.API_BASE_URL = '';
    } else {
      // 本番（GitHub Pages）用のデフォルト
      config.API_BASE_URL =
        'https://script.google.com/macros/s/AKfycbwBz_jGdch1PLirq0fWWiABbdN2zSBi7P2i8PwbxIa-gMGnt0YTQ1lg_UyolKIcKqu9/exec';
    }
  }

  window.APP_CONFIG = config;
})();

