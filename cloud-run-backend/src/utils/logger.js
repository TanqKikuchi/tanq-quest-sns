export function logError (error, context = {}) {
  const logData = {
    severity: 'ERROR',
    message: error.message,
    stack: error.stack,
    code: error.code,
    status: error.status,
    ...context,
    timestamp: new Date().toISOString()
  }
  console.error(JSON.stringify(logData))
}

export function logInfo (message, context = {}) {
  const logData = {
    severity: 'INFO',
    message,
    ...context,
    timestamp: new Date().toISOString()
  }
  console.log(JSON.stringify(logData))
}
