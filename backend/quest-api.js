/**
 * クエスト関連API
 */

/**
 * 今週のクエスト取得
 * GET /api/quests/current
 */
function handleGetCurrentQuest(request) {
  try {
    const today = getCurrentDate();
    
    // Questsテーブルから今週のクエストを検索
    const questsData = getSheetData('Quests');
    const headers = getSheetHeaders('Quests');
    
    const weekStartIndex = headers.indexOf('week_start');
    const weekEndIndex = headers.indexOf('week_end');
    
    // 今日が範囲内のクエストを検索
    let currentQuest = null;
    
    questsData.forEach((row, index) => {
      const weekStart = row[weekStartIndex];
      const weekEnd = row[weekEndIndex];
      
      if (isDateInRange(today, weekStart, weekEnd)) {
        // オブジェクトに変換
        const quest = {};
        headers.forEach((header, colIndex) => {
          quest[header] = row[colIndex];
        });
        currentQuest = quest;
      }
    });
    
    if (!currentQuest) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Current quest not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ quest: currentQuest })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 過去のクエスト一覧取得
 * GET /api/quests
 */
function handleGetQuests(request) {
  try {
    const chapter = getQueryParameter(request, 'chapter');
    const limit = parseInt(getQueryParameter(request, 'limit', 20));
    const offset = parseInt(getQueryParameter(request, 'offset', 0));
    
    let questsData = getSheetData('Quests');
    const headers = getSheetHeaders('Quests');
    
    // 章でフィルタ
    if (chapter) {
      const chapterIndex = headers.indexOf('chapter');
      questsData = questsData.filter(row => {
        return String(row[chapterIndex]) === String(chapter);
      });
    }
    
    // 週終了日でソート（新しい順）
    const weekEndIndex = headers.indexOf('week_end');
    questsData.sort((a, b) => {
      const dateA = parseDate(a[weekEndIndex]);
      const dateB = parseDate(b[weekEndIndex]);
      return dateB - dateA; // 降順
    });
    
    // ページネーション
    const total = questsData.length;
    const paginatedData = questsData.slice(offset, offset + limit);
    
    // オブジェクトに変換
    const quests = paginatedData.map(row => {
      const quest = {};
      headers.forEach((header, colIndex) => {
        quest[header] = row[colIndex];
      });
      return quest;
    });
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({
        quests: quests,
        total: total,
        limit: limit,
        offset: offset
      })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * クエスト詳細取得
 * GET /api/quests/:id
 */
function handleGetQuest(request) {
  try {
    const questId = request.parameter.id;
    
    if (!questId) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('INVALID_REQUEST', 'Quest ID is required')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const rowIndex = findRow('Quests', 1, questId); // id列は1列目
    
    if (!rowIndex) {
      return ContentService.createTextOutput(JSON.stringify(
        createErrorResponse('NOT_FOUND', 'Quest not found')
      )).setMimeType(ContentService.MimeType.JSON);
    }
    
    const quest = rowToObject('Quests', rowIndex);
    
    return ContentService.createTextOutput(JSON.stringify(
      createSuccessResponse({ quest: quest })
    )).setMimeType(ContentService.MimeType.JSON);
    
  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify(
      createErrorResponse('SERVER_ERROR', e.message)
    )).setMimeType(ContentService.MimeType.JSON);
  }
}

