/**
 * 画像アップロードAPI
 * Google Drive APIを使用して画像をアップロード
 */

/**
 * 画像アップロード
 * POST /api/images/upload
 */
function handleUploadImage(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 凍結チェック
    if (!isActive(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Account is frozen')
      )
    }
    
    const body = getRequestBody(request);
    validateRequired(body, ['image_data', 'filename']);
    
    // Base64データをデコード
    const imageData = body.image_data;
    const filename = body.filename;
    
    // data:image/jpeg;base64, のプレフィックスを除去
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), 'image/jpeg', filename);
    
    // Google Driveにアップロード
    const folderId = getImageFolderId();
    const file = uploadToDrive(blob, filename, folderId);
    
    // ファイルを公開設定にする
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // 公開URLを取得
    const imageUrl = file.getUrl().replace('/edit', '/view');
    // または直接画像URLを取得
    const directImageUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    
    return createCorsResponse(
      createSuccessResponse({
        image_url: directImageUrl,
        file_id: file.getId()
      })
    )
    
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      return createCorsResponse(
        createErrorResponse('UNAUTHORIZED', 'Authentication required')
      )
    }
    
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 複数画像アップロード
 * POST /api/images/upload-multiple
 */
function handleUploadMultipleImages(request) {
  try {
    const userId = getCurrentUserId(request);
    
    // 凍結チェック
    if (!isActive(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Account is frozen')
      )
    }
    
    const body = getRequestBody(request);
    validateRequired(body, ['images']);
    
    if (!Array.isArray(body.images)) {
      return createCorsResponse(
        createErrorResponse('VALIDATION_ERROR', 'Images must be an array')
      )
    }
    
    if (body.images.length > 4) {
      return createCorsResponse(
        createErrorResponse('VALIDATION_ERROR', 'Maximum 4 images allowed')
      )
    }
    
    const folderId = getImageFolderId();
    const imageUrls = [];
    
    body.images.forEach((imageData, index) => {
      try {
        // Base64データをデコード
        const base64Data = imageData.data.replace(/^data:image\/\w+;base64,/, '');
        const mimeType = imageData.mime_type || 'image/jpeg';
        const filename = imageData.filename || `image_${Date.now()}_${index}.jpg`;
        
        const blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
        
        // Google Driveにアップロード
        const file = uploadToDrive(blob, filename, folderId);
        
        // ファイルを公開設定にする
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        
        // 直接画像URLを取得
        const directImageUrl = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
        imageUrls.push(directImageUrl);
      } catch (e) {
        console.error(`Error uploading image ${index}:`, e);
        // エラーが発生しても続行
      }
    });
    
    return createCorsResponse(
      createSuccessResponse({
        image_urls: imageUrls
      })
    )
    
  } catch (e) {
    if (e.message === 'UNAUTHORIZED') {
      return createCorsResponse(
        createErrorResponse('UNAUTHORIZED', 'Authentication required')
      )
    }
    
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

/**
 * 画像フォルダIDを取得
 * スクリプトプロパティから取得、または新規作成
 * 
 * 個人Driveと共有Drive（Shared Drive）の両方に対応
 * 共有Driveを使用する場合は、スクリプトプロパティでフォルダIDを指定
 */
function getImageFolderId() {
  const scriptProperties = PropertiesService.getScriptProperties();
  let folderId = scriptProperties.getProperty('IMAGE_FOLDER_ID');
  
  if (!folderId) {
    // フォルダが存在しない場合は新規作成（個人Driveに作成）
    const folderName = 'SNS投稿画像';
    const folders = DriveApp.getFoldersByName(folderName);
    
    let folder;
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder(folderName);
    }
    
    folderId = folder.getId();
    scriptProperties.setProperty('IMAGE_FOLDER_ID', folderId);
  }
  
  return folderId;
}

/**
 * Google Driveにファイルをアップロード
 * 個人Driveと共有Drive（Shared Drive）の両方に対応
 * 
 * @param {Blob} blob - アップロードするファイルのBlob
 * @param {string} filename - ファイル名
 * @param {string} folderId - フォルダID（個人Driveまたは共有Drive）
 * @return {File} アップロードされたファイルオブジェクト
 */
function uploadToDrive(blob, filename, folderId) {
  try {
    // フォルダIDからフォルダを取得（個人Driveと共有Driveの両方に対応）
    const folder = DriveApp.getFolderById(folderId);
    const file = folder.createFile(blob);
    
    // ファイル名を設定（既にblobに設定されているが、念のため）
    if (filename) {
      file.setName(filename);
    }
    
    return file;
  } catch (e) {
    // エラーハンドリング: フォルダが見つからない、権限がないなどの場合
    throw new Error(`Failed to upload to Drive: ${e.message}`);
  }
}

/**
 * 画像を削除
 * DELETE /api/images/:file_id
 */
function handleDeleteImage(request) {
  try {
    const userId = getCurrentUserId(request);
    const fileId = request.parameter.file_id;
    
    // 権限チェック: 管理者・モデレーター、または自分の投稿の画像のみ削除可能
    // 簡易実装: 管理者・モデレーターのみ
    if (!isModeratorOrAdmin(userId)) {
      return createCorsResponse(
        createErrorResponse('FORBIDDEN', 'Permission denied')
      )
    }
    
    if (!fileId) {
      return createCorsResponse(
        createErrorResponse('INVALID_REQUEST', 'File ID is required')
      )
    }
    
    try {
      const file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      
      return createCorsResponse(
        createSuccessResponse({ message: 'Image deleted successfully' })
      )
    } catch (e) {
      return createCorsResponse(
        createErrorResponse('NOT_FOUND', 'File not found')
      )
    }
    
  } catch (e) {
    return createCorsResponse(
      createErrorResponse('SERVER_ERROR', e.message)
    )
  }
}

