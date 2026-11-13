const fs = require('node:fs/promises')
const path = require('node:path')
const mysql = require('mysql2/promise')
const env = require('../src/config/env')

async function setupDatabase() {
  const { database, ...connectionOptions } = env.db
  const connection = await mysql.createConnection(connectionOptions)

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${mysql.escapeId(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    )
    await connection.changeUser({ database })

    const schema = await fs.readFile(
      path.resolve(__dirname, '../../database/schema.sql'),
      'utf8',
    )
    // The schema header names the default database; use the configured database.
    const tables = schema.slice(schema.indexOf('CREATE TABLE'))
    for (const statement of tables.split(';').map((sql) => sql.trim()).filter(Boolean)) {
      await connection.query(statement)
    }

    console.log(`Database ${database} is ready. Existing data was preserved.`)
  } finally {
    await connection.end()
  }
}

setupDatabase().catch((error) => {
  console.error('Database setup failed:', error.message)
  process.exitCode = 1
})
