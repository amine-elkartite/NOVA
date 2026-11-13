USE nova_ecommerce;

SET @add_promotions_created_at = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'promotions'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'promotions'
        AND COLUMN_NAME = 'created_at'
    ),
    'ALTER TABLE promotions ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER status',
    'SELECT 1'
  )
);
PREPARE add_promotions_created_at_stmt FROM @add_promotions_created_at;
EXECUTE add_promotions_created_at_stmt;
DEALLOCATE PREPARE add_promotions_created_at_stmt;

SET @add_promotions_updated_at = (
  SELECT IF(
    EXISTS (
      SELECT 1
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'promotions'
    )
    AND NOT EXISTS (
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'promotions'
        AND COLUMN_NAME = 'updated_at'
    ),
    'ALTER TABLE promotions ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    'SELECT 1'
  )
);
PREPARE add_promotions_updated_at_stmt FROM @add_promotions_updated_at;
EXECUTE add_promotions_updated_at_stmt;
DEALLOCATE PREPARE add_promotions_updated_at_stmt;

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

CREATE TABLE IF NOT EXISTS support_conversation_tags (
  conversation_id BIGINT UNSIGNED NOT NULL,
  tag VARCHAR(80) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (conversation_id, tag),
  CONSTRAINT support_conversation_tags_conversation_foreign
    FOREIGN KEY (conversation_id) REFERENCES support_conversations(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
