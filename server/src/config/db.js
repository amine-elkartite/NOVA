const mysql = require('mysql2/promise')
const env = require('./env')

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

const userColumns = [
  ['first_name', 'ADD COLUMN first_name VARCHAR(100) NULL AFTER id'],
  ['last_name', 'ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name'],
  ['email', 'ADD COLUMN email VARCHAR(191) NULL AFTER last_name'],
  ['phone', 'ADD COLUMN phone VARCHAR(30) NULL AFTER email'],
  ['city', 'ADD COLUMN city VARCHAR(100) NULL AFTER phone'],
  ['country', "ADD COLUMN country VARCHAR(100) NULL DEFAULT 'Maroc' AFTER city"],
  ['avatar_url', 'ADD COLUMN avatar_url VARCHAR(255) NULL AFTER country'],
  [
    'newsletter_opt_in',
    'ADD COLUMN newsletter_opt_in TINYINT(1) NOT NULL DEFAULT 0 AFTER avatar_url',
  ],
  ['password_hash', 'ADD COLUMN password_hash VARCHAR(255) NULL AFTER newsletter_opt_in'],
  [
    'two_factor_enabled',
    'ADD COLUMN two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash',
  ],
  ['two_factor_secret', 'ADD COLUMN two_factor_secret VARCHAR(255) NULL AFTER two_factor_enabled'],
  ["role", "ADD COLUMN role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer' AFTER two_factor_secret"],
  ['is_active', 'ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER role'],
  ['created_at', 'ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_active'],
  [
    'updated_at',
    'ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
  ],
]

async function columnExists(tableName, columnName) {
  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
    `,
    [env.db.database, tableName, columnName],
  )

  return Number(rows[0].total) > 0
}

async function tableExists(tableName) {
  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
    `,
    [env.db.database, tableName],
  )

  return Number(rows[0].total) > 0
}

async function indexExists(tableName, indexName) {
  const [rows] = await pool.execute(
    `
      SELECT COUNT(*) AS total
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = ?
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
    `,
    [env.db.database, tableName, indexName],
  )

  return Number(rows[0].total) > 0
}

async function ensureColumn(tableName, columnName, alterSql) {
  if (!(await columnExists(tableName, columnName))) {
    await pool.query(`ALTER TABLE ${tableName} ${alterSql}`)
  }
}

async function ensureIndex(tableName, indexName, alterSql) {
  if (!(await indexExists(tableName, indexName))) {
    await pool.query(`ALTER TABLE ${tableName} ${alterSql}`)
  }
}

async function ensureAuthSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(30) NULL,
      city VARCHAR(100) NULL,
      country VARCHAR(100) NULL DEFAULT 'Maroc',
      avatar_url VARCHAR(255) NULL,
      newsletter_opt_in TINYINT(1) NOT NULL DEFAULT 0,
      password_hash VARCHAR(255) NOT NULL,
      two_factor_enabled TINYINT(1) NOT NULL DEFAULT 0,
      two_factor_secret VARCHAR(255) NULL,
      role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY users_email_unique (email),
      KEY users_role_index (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  for (const [columnName, alterSql] of userColumns) {
    await ensureColumn('users', columnName, alterSql)
  }

  await ensureIndex('users', 'users_email_unique', 'ADD UNIQUE KEY users_email_unique (email)')
  await ensureIndex('users', 'users_role_index', 'ADD KEY users_role_index (role)')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY password_reset_tokens_hash_unique (token_hash),
      KEY password_reset_tokens_user_id_index (user_id),
      CONSTRAINT password_reset_tokens_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      session_id VARCHAR(191) NOT NULL,
      user_agent VARCHAR(255) NULL,
      ip_address VARCHAR(45) NULL,
      last_seen_at DATETIME NOT NULL,
      expires_at DATETIME NOT NULL,
      revoked_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY user_sessions_session_id_unique (session_id),
      KEY user_sessions_user_id_index (user_id),
      KEY user_sessions_expires_at_index (expires_at),
      CONSTRAINT user_sessions_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS two_factor_challenges (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      token_hash CHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY two_factor_challenges_token_hash_unique (token_hash),
      KEY two_factor_challenges_user_id_index (user_id),
      KEY two_factor_challenges_expires_at_index (expires_at),
      CONSTRAINT two_factor_challenges_user_id_foreign
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

async function ensureAdminSchema() {
  if (await tableExists('promotions')) {
    await ensureColumn(
      'promotions',
      'created_at',
      'ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status',
    )
    await ensureColumn(
      'promotions',
      'updated_at',
      'ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    )
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL,
      setting_value LONGTEXT NOT NULL,
      updated_by INT UNSIGNED NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY admin_settings_key_unique (setting_key),
      KEY admin_settings_updated_by_index (updated_by),
      CONSTRAINT admin_settings_updated_by_foreign
        FOREIGN KEY (updated_by) REFERENCES users(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_conversations (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      customer_id INT UNSIGNED NULL,
      created_by_admin_id INT UNSIGNED NULL,
      subject VARCHAR(191) NOT NULL DEFAULT 'Conversation client',
      status ENUM('open', 'pending', 'resolved', 'archived') NOT NULL DEFAULT 'open',
      unread_count INT NOT NULL DEFAULT 0,
      last_message_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY support_conversations_customer_index (customer_id),
      KEY support_conversations_admin_index (created_by_admin_id),
      KEY support_conversations_status_index (status),
      KEY support_conversations_last_message_index (last_message_at),
      CONSTRAINT support_conversations_customer_foreign
        FOREIGN KEY (customer_id) REFERENCES users(id)
        ON DELETE SET NULL,
      CONSTRAINT support_conversations_admin_foreign
        FOREIGN KEY (created_by_admin_id) REFERENCES users(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_messages (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      conversation_id BIGINT UNSIGNED NOT NULL,
      sender_type ENUM('customer', 'admin') NOT NULL,
      sender_user_id INT UNSIGNED NULL,
      body TEXT NOT NULL,
      attachment_url VARCHAR(255) NULL,
      read_at DATETIME NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY support_messages_conversation_index (conversation_id),
      KEY support_messages_sender_index (sender_user_id),
      KEY support_messages_created_index (created_at),
      CONSTRAINT support_messages_conversation_foreign
        FOREIGN KEY (conversation_id) REFERENCES support_conversations(id)
        ON DELETE CASCADE,
      CONSTRAINT support_messages_sender_foreign
        FOREIGN KEY (sender_user_id) REFERENCES users(id)
        ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_conversation_tags (
      conversation_id BIGINT UNSIGNED NOT NULL,
      tag VARCHAR(80) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (conversation_id, tag),
      CONSTRAINT support_conversation_tags_conversation_foreign
        FOREIGN KEY (conversation_id) REFERENCES support_conversations(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_notification_reads (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      user_id INT UNSIGNED NOT NULL,
      notification_key VARCHAR(191) NOT NULL,
      read_at DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY admin_notification_reads_user_key_unique (user_id, notification_key),
      KEY admin_notification_reads_user_index (user_id),
      CONSTRAINT admin_notification_reads_user_foreign
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `)
}

async function checkDatabaseConnection() {
  const connection = await pool.getConnection()

  try {
    await connection.ping()
  } finally {
    connection.release()
  }
}

module.exports = pool
module.exports.ensureAuthSchema = ensureAuthSchema
module.exports.ensureAdminSchema = ensureAdminSchema
module.exports.checkDatabaseConnection = checkDatabaseConnection
