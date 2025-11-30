/**
 * データベース初期化スクリプト
 * 
 * このスクリプトを実行すると、Googleスプレッドシートに
 * 仕様書に基づく全テーブル（シート）が作成されます。
 * 
 * 使用方法:
 * 1. Googleスプレッドシートを新規作成
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトを貼り付ける
 * 4. initializeDatabase() 関数を実行
 */

/**
 * データベースを初期化する
 * すべてのテーブル（シート）を作成し、ヘッダー行を設定する
 */
function initializeDatabase() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  // 既存のシートを削除（オプション: 初期化時のみ）
  // const sheets = spreadsheet.getSheets();
  // sheets.forEach(sheet => {
  //   if (sheet.getName() !== 'README') {
  //     spreadsheet.deleteSheet(sheet);
  //   }
  // });
  
  // 各テーブルを作成
  createUsersTable(spreadsheet);
  createProfilesTable(spreadsheet);
  createPostsTable(spreadsheet);
  createStampsTable(spreadsheet);
  createQuestsTable(spreadsheet);
  createFollowsTable(spreadsheet);
  createReportsTable(spreadsheet);
  createSchoolsTable(spreadsheet);
  createClassesTable(spreadsheet);
  createBadgesTable(spreadsheet);
  createUserBadgesTable(spreadsheet);
  createPostLimitsTable(spreadsheet);
  
  Logger.log('データベースの初期化が完了しました。');
}

/**
 * Usersテーブルを作成
 */
function createUsersTable(spreadsheet) {
  const sheetName = 'Users';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'email',
    'role',
    'status',
    'created_at',
    'last_login_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 250); // email
  sheet.setColumnWidth(3, 120); // role
  sheet.setColumnWidth(4, 100); // status
  sheet.setColumnWidth(5, 180); // created_at
  sheet.setColumnWidth(6, 180); // last_login_at
}

/**
 * Profilesテーブルを作成
 */
function createProfilesTable(spreadsheet) {
  const sheetName = 'Profiles';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'user_id',
    'nickname',
    'grade',
    'class_id',
    'school_id',
    'greeting',
    'level',
    'completed_chapter'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // user_id
  sheet.setColumnWidth(2, 150); // nickname
  sheet.setColumnWidth(3, 80);  // grade
  sheet.setColumnWidth(4, 200); // class_id
  sheet.setColumnWidth(5, 200); // school_id
  sheet.setColumnWidth(6, 300); // greeting
  sheet.setColumnWidth(7, 80);  // level
  sheet.setColumnWidth(8, 120); // completed_chapter
}

/**
 * Postsテーブルを作成
 */
function createPostsTable(spreadsheet) {
  const sheetName = 'Posts';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'user_id',
    'quest_id',
    'title',
    'body',
    'image_urls',
    'effort_score',
    'excitement_score',
    'is_public',
    'allow_promotion',
    'created_at',
    'updated_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 250); // user_id
  sheet.setColumnWidth(3, 250); // quest_id
  sheet.setColumnWidth(4, 200); // title
  sheet.setColumnWidth(5, 400); // body
  sheet.setColumnWidth(6, 400); // image_urls
  sheet.setColumnWidth(7, 100); // effort_score
  sheet.setColumnWidth(8, 120); // excitement_score
  sheet.setColumnWidth(9, 100); // is_public
  sheet.setColumnWidth(10, 120); // allow_promotion
  sheet.setColumnWidth(11, 180); // created_at
  sheet.setColumnWidth(12, 180); // updated_at
}

/**
 * Stampsテーブルを作成
 */
function createStampsTable(spreadsheet) {
  const sheetName = 'Stamps';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'post_id',
    'user_id',
    'stamp_type',
    'created_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 250); // post_id
  sheet.setColumnWidth(3, 250); // user_id
  sheet.setColumnWidth(4, 120); // stamp_type
  sheet.setColumnWidth(5, 180); // created_at
}

/**
 * Questsテーブルを作成
 */
function createQuestsTable(spreadsheet) {
  const sheetName = 'Quests';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'title',
    'description',
    'chapter',
    'week_start',
    'week_end',
    'type',
    'target_grade_range',
    'image_url'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 200); // title
  sheet.setColumnWidth(3, 400); // description
  sheet.setColumnWidth(4, 100); // chapter
  sheet.setColumnWidth(5, 120); // week_start
  sheet.setColumnWidth(6, 120); // week_end
  sheet.setColumnWidth(7, 120); // type
  sheet.setColumnWidth(8, 150); // target_grade_range
  sheet.setColumnWidth(9, 400); // image_url
}

/**
 * Followsテーブルを作成
 */
function createFollowsTable(spreadsheet) {
  const sheetName = 'Follows';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'follower_id',
    'followee_id',
    'created_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // follower_id
  sheet.setColumnWidth(2, 250); // followee_id
  sheet.setColumnWidth(3, 180); // created_at
}

/**
 * Reportsテーブルを作成
 */
function createReportsTable(spreadsheet) {
  const sheetName = 'Reports';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'post_id',
    'reporter_id',
    'reason',
    'status',
    'handled_by',
    'created_at',
    'updated_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 250); // post_id
  sheet.setColumnWidth(3, 250); // reporter_id
  sheet.setColumnWidth(4, 300); // reason
  sheet.setColumnWidth(5, 120); // status
  sheet.setColumnWidth(6, 250); // handled_by
  sheet.setColumnWidth(7, 180); // created_at
  sheet.setColumnWidth(8, 180); // updated_at
}

/**
 * Schoolsテーブルを作成
 */
function createSchoolsTable(spreadsheet) {
  const sheetName = 'Schools';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'name',
    'created_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 200); // name
  sheet.setColumnWidth(3, 180); // created_at
}

/**
 * Classesテーブルを作成
 */
function createClassesTable(spreadsheet) {
  const sheetName = 'Classes';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'name',
    'school_id',
    'created_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 200); // name
  sheet.setColumnWidth(3, 250); // school_id
  sheet.setColumnWidth(4, 180); // created_at
}

/**
 * Badgesテーブルを作成
 */
function createBadgesTable(spreadsheet) {
  const sheetName = 'Badges';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'id',
    'name',
    'description',
    'icon_url',
    'created_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // id
  sheet.setColumnWidth(2, 200); // name
  sheet.setColumnWidth(3, 300); // description
  sheet.setColumnWidth(4, 400); // icon_url
  sheet.setColumnWidth(5, 180); // created_at
}

/**
 * UserBadgesテーブルを作成
 */
function createUserBadgesTable(spreadsheet) {
  const sheetName = 'UserBadges';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'user_id',
    'badge_id',
    'earned_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // user_id
  sheet.setColumnWidth(2, 250); // badge_id
  sheet.setColumnWidth(3, 180); // earned_at
}

/**
 * PostLimitsテーブルを作成
 */
function createPostLimitsTable(spreadsheet) {
  const sheetName = 'PostLimits';
  let sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  const headers = [
    'user_id',
    'date',
    'post_count',
    'created_at'
  ];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // 列幅を調整
  sheet.setColumnWidth(1, 250); // user_id
  sheet.setColumnWidth(2, 120); // date
  sheet.setColumnWidth(3, 100); // post_count
  sheet.setColumnWidth(4, 180); // created_at
}


