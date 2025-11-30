/**
 * 共通ユーティリティ関数
 */

/**
 * スプレッドシートIDを取得（環境変数または固定値）
 * 本番環境では、スクリプトプロパティから取得することを推奨
 */
function getSpreadsheetId() {
  // スクリプトプロパティから取得を試みる
  const scriptProperties = PropertiesService.getScriptProperties();
  const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
  
  if (spreadsheetId) {
    return spreadsheetId;
  }
  
  // デフォルト: 現在のスプレッドシート
  return SpreadsheetApp.getActiveSpreadsheet().getId();
}

/**
 * スプレッドシートオブジェクトを取得
 */
function getSpreadsheet() {
  const spreadsheetId = getSpreadsheetId();
  return SpreadsheetApp.openById(spreadsheetId);
}

/**
 * シートを取得
 */
function getSheet(sheetName) {
  const spreadsheet = getSpreadsheet();
  const sheet = spreadsheet.getSheetByName(sheetName);
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }
  
  return sheet;
}

/**
 * シートの全データを取得（ヘッダー行を除く）
 */
function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return [];
  }
  
  const range = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn());
  return range.getValues();
}

/**
 * シートのヘッダー行を取得
 */
function getSheetHeaders(sheetName) {
  const sheet = getSheet(sheetName);
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  return headerRange.getValues()[0];
}

/**
 * 行を追加
 */
function appendRow(sheetName, rowData) {
  const sheet = getSheet(sheetName);
  sheet.appendRow(rowData);
  return sheet.getLastRow();
}

/**
 * 行を更新
 */
function updateRow(sheetName, rowIndex, rowData) {
  const sheet = getSheet(sheetName);
  const headers = getSheetHeaders(sheetName);
  
  rowData.forEach((value, index) => {
    if (index < headers.length) {
      sheet.getRange(rowIndex, index + 1).setValue(value);
    }
  });
}

/**
 * 行を削除
 */
function deleteRow(sheetName, rowIndex) {
  const sheet = getSheet(sheetName);
  sheet.deleteRow(rowIndex);
}

/**
 * 条件に一致する行を検索
 */
function findRows(sheetName, columnIndex, value) {
  const sheet = getSheet(sheetName);
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return [];
  }
  
  const dataRange = sheet.getRange(2, columnIndex, lastRow - 1, 1);
  const values = dataRange.getValues();
  const matchingRows = [];
  
  values.forEach((row, index) => {
    if (row[0] === value) {
      matchingRows.push(index + 2); // 実際の行番号（ヘッダー行を考慮）
    }
  });
  
  return matchingRows;
}

/**
 * 条件に一致する最初の行を検索
 */
function findRow(sheetName, columnIndex, value) {
  const rows = findRows(sheetName, columnIndex, value);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * 行データをオブジェクトに変換
 */
function rowToObject(sheetName, rowIndex) {
  const sheet = getSheet(sheetName);
  const headers = getSheetHeaders(sheetName);
  const rowRange = sheet.getRange(rowIndex, 1, 1, headers.length);
  const values = rowRange.getValues()[0];
  
  const obj = {};
  headers.forEach((header, index) => {
    obj[header] = values[index];
  });
  
  return obj;
}

/**
 * オブジェクトを行データに変換
 */
function objectToRow(sheetName, obj) {
  const headers = getSheetHeaders(sheetName);
  const row = [];
  
  headers.forEach(header => {
    row.push(obj[header] !== undefined ? obj[header] : '');
  });
  
  return row;
}

/**
 * UUID v4を生成
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * 現在の日時をISO 8601形式で取得
 */
function getCurrentDateTime() {
  return new Date().toISOString();
}

/**
 * 現在の日付をYYYY-MM-DD形式で取得
 */
function getCurrentDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 日付文字列をDateオブジェクトに変換
 */
function parseDate(dateString) {
  return new Date(dateString);
}

/**
 * 日付が指定範囲内かチェック
 */
function isDateInRange(date, startDate, endDate) {
  const d = parseDate(date);
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  return d >= start && d <= end;
}

/**
 * エラーレスポンスを生成
 */
function createErrorResponse(code, message) {
  return {
    success: false,
    error: {
      code: code,
      message: message
    }
  };
}

/**
 * 成功レスポンスを生成
 */
function createSuccessResponse(data) {
  return {
    success: true,
    ...data
  };
}

/**
 * リクエストボディを取得
 */
function getRequestBody(request) {
  try {
    if (request.postData && request.postData.contents) {
      return JSON.parse(request.postData.contents);
    }
    return {};
  } catch (e) {
    return {};
  }
}

/**
 * クエリパラメータを取得
 */
function getQueryParameter(request, name, defaultValue = null) {
  const parameter = request.parameter[name];
  return parameter !== undefined ? parameter : defaultValue;
}

/**
 * 認証トークンまたはセッションからユーザーIDを取得
 * 簡易実装: リクエストヘッダーから取得
 */
function getCurrentUserId(request) {
  // 実際の実装では、セッション管理やJWTトークンを使用
  const userId = request.headers['X-User-Id'] || request.parameter.user_id;
  
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  
  return userId;
}

/**
 * ユーザーのロールを取得
 */
function getUserRole(userId) {
  try {
    const rowIndex = findRow('Users', 1, userId); // id列は1列目
    if (!rowIndex) {
      return null;
    }
    
    const user = rowToObject('Users', rowIndex);
    return user.role;
  } catch (e) {
    return null;
  }
}

/**
 * ユーザーのステータスを取得
 */
function getUserStatus(userId) {
  try {
    const rowIndex = findRow('Users', 1, userId);
    if (!rowIndex) {
      return null;
    }
    
    const user = rowToObject('Users', rowIndex);
    return user.status;
  } catch (e) {
    return null;
  }
}

/**
 * 権限チェック: 管理者かどうか
 */
function isAdmin(userId) {
  const role = getUserRole(userId);
  return role === 'Admin';
}

/**
 * 権限チェック: モデレーター以上かどうか
 */
function isModeratorOrAdmin(userId) {
  const role = getUserRole(userId);
  return role === 'Admin' || role === 'Moderator';
}

/**
 * 権限チェック: 凍結されていないか
 */
function isActive(userId) {
  const status = getUserStatus(userId);
  return status === 'active';
}

/**
 * バリデーション: 必須フィールドチェック
 */
function validateRequired(obj, fields) {
  const missing = [];
  
  fields.forEach(field => {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      missing.push(field);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
}

/**
 * バリデーション: 数値範囲チェック
 */
function validateRange(value, min, max) {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Value must be between ${min} and ${max}`);
  }
  return num;
}

/**
 * バリデーション: 配列長チェック
 */
function validateArrayLength(arr, maxLength) {
  if (arr.length > maxLength) {
    throw new Error(`Array length must be at most ${maxLength}`);
  }
}

/**
 * 画像URL配列をカンマ区切り文字列に変換
 */
function imageUrlsToString(urls) {
  if (!urls || !Array.isArray(urls)) {
    return '';
  }
  return urls.join(',');
}

/**
 * カンマ区切り文字列を画像URL配列に変換
 */
function stringToImageUrls(str) {
  if (!str || str === '') {
    return [];
  }
  return str.split(',').filter(url => url.trim() !== '');
}

/**
 * スタンプタイプのバリデーション
 */
function validateStampType(stampType) {
  const validTypes = ['clap', 'heart', 'eye'];
  if (!validTypes.includes(stampType)) {
    throw new Error(`Invalid stamp type: ${stampType}`);
  }
  return stampType;
}

/**
 * ロールのバリデーション
 */
function validateRole(role) {
  const validRoles = ['Admin', 'Moderator', 'Student', 'Parent', 'Graduate', 'Staff'];
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role: ${role}`);
  }
  return role;
}

/**
 * ステータスのバリデーション
 */
function validateStatus(status) {
  const validStatuses = ['active', 'frozen'];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  return status;
}

/**
 * CORS対応のレスポンスを返す（HtmlService版）
 * すべてのAPIハンドラーでこの関数を使用してください
 * 
 * 注意: GAS Web Appsでは、HtmlServiceを使用することでCORSヘッダーが
 * 自動的に設定されます。MIMEタイプはContentServiceを使用して設定します。
 */
function createCorsResponse(data) {
  const json = JSON.stringify(data);
  // HtmlServiceでJSONを返す場合、setContentでJSON文字列を設定
  // MIMEタイプは自動的に推測されますが、明示的に設定するために
  // ContentServiceのMimeTypeを使用します
  return HtmlService.createHtmlOutput(json)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

