import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import { config } from './config/env.js'
import { corsMiddleware } from './middleware/cors.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import usersRouter from './routes/users.js'
import questsRouter from './routes/quests.js'
import followsRouter from './routes/follows.js'
import postsRouter from './routes/posts.js'
import profilesRouter from './routes/profiles.js'

const app = express()

app.use(helmet())
app.use(morgan(config.isProd ? 'combined' : 'dev'))
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(corsMiddleware)

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Cloud Run backend is running' })
})

app.use('/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/quests', questsRouter)
app.use('/api/follows', followsRouter)
app.use('/api/posts', postsRouter)
app.use('/api/profiles', profilesRouter)

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  })
})

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`)
})
