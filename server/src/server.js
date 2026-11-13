require('./config/env')

const app = require('./app')
const env = require('./config/env')
const {
  ensureAdminSchema,
  ensureAuthSchema,
} = require('./config/db')
const pool = require('./config/db')

async function startServer() {
  try {
    await ensureAuthSchema()
    console.log('Auth database schema is ready.')
    await ensureAdminSchema()
    console.log('Admin database schema is ready.')
  } catch (error) {
    console.error('Database schema could not be verified. Check MySQL/XAMPP configuration and run node scripts/setup-db.js from server/.')
    console.error(error.message)
    await pool.end()
    process.exitCode = 1
    return
  }

  app.listen(env.port, () => {
    console.log(`NOVA API running on port ${env.port}`)
  })
}

startServer()
