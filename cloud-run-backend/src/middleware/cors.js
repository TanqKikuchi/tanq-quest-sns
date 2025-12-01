import cors from 'cors'
import { config } from '../config/env.js'

export const corsMiddleware = cors({
  origin (origin, callback) {
    if (!origin) {
      return callback(null, true)
    }
    if (config.allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} is not allowed`))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id'],
  credentials: true,
  optionsSuccessStatus: 204
})
