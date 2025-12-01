import { logError } from '../utils/logger.js'

export function errorHandler (err, req, res, next) {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  logError(err, {
    errorId,
    path: req.path,
    method: req.method,
    userId: req.header('x-user-id')
  })

  const status = err.status || 500
  const payload = {
    success: false,
    error: {
      code: err.code || (status === 500 ? 'SERVER_ERROR' : 'REQUEST_ERROR'),
      message: err.message || 'Unexpected error',
      errorId: status === 500 ? errorId : undefined
    }
  }
  res.status(status).json(payload)
}
