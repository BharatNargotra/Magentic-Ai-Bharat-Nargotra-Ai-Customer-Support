import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { readFileSync } from 'fs'
import { join } from 'path'

import authRoutes from './auth/routes'
import knowledgeRoutes from './knowledge/routes'
import chatRoutes from './chat/routes'
import ticketRoutes from './tickets/routes'
import analyticsRoutes from './analytics/routes'
import configRoutes from './config/routes'

const app = new Hono()

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: false,
}))

app.use('*', logger())

app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.get('/widget.js', (c) => {
  try {
    const widgetPath = join(process.cwd(), 'src', 'widget.js')
    const code = readFileSync(widgetPath, 'utf-8')
    c.header('Content-Type', 'application/javascript')
    c.header('Cache-Control', 'public, max-age=3600')
    c.header('Access-Control-Allow-Origin', '*')
    return c.body(code)
  } catch {
    return c.text('Widget not found', 404)
  }
})

app.route('/api/auth', authRoutes)
app.route('/api/knowledge', knowledgeRoutes)
app.route('/api/chat', chatRoutes)
app.route('/api/tickets', ticketRoutes)
app.route('/api/analytics', analyticsRoutes)
app.route('/api/config', configRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error', message: err.message }, 500)
})

const port = parseInt(process.env.PORT || '3001')
console.log('🚀 Server running on http://localhost:' + port)

serve({ fetch: app.fetch, port })