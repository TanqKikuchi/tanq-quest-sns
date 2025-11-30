/**
 * ルーター
 * ページ遷移を管理
 */

class Router {
  constructor() {
    this.currentPage = null;
    this.init();
  }

  init() {
    // ナビゲーションリンクのイベントリスナー
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.getAttribute('data-page');
        this.navigate(page);
      });
    });

    // ハッシュ変更の監視
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        this.navigate(hash);
      }
    });

    // 初期ページを表示
    const hash = window.location.hash.slice(1);
    if (hash) {
      this.navigate(hash);
    } else {
      this.navigate('login');
    }
  }

  navigate(page) {
    // すべてのページを非表示
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });

    // 対象ページを表示
    const targetPage = document.getElementById(`${page}-page`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = page;

      // ページ固有の初期化処理
      this.initPage(page);
    }
  }

  initPage(page) {
    switch (page) {
      case 'quest':
        if (typeof initQuestPage === 'function') {
          initQuestPage();
        }
        break;
      case 'community':
        if (typeof initCommunityPage === 'function') {
          initCommunityPage();
        }
        break;
      case 'post':
        if (typeof initPostPage === 'function') {
          initPostPage();
        }
        break;
      case 'profile':
        if (typeof initProfilePage === 'function') {
          initProfilePage();
        }
        break;
      case 'post-edit':
        // 編集ページは既に表示されている
        break;
      case 'admin':
        if (typeof initAdminPage === 'function') {
          initAdminPage();
        }
        break;
    }
  }

  showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => {
      p.classList.remove('active');
    });
    const page = document.getElementById(pageId);
    if (page) {
      page.classList.add('active');
    }
  }
}

// グローバルインスタンス
const router = new Router();

