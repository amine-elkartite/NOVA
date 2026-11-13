USE nova_ecommerce;

ALTER TABLE orders
  MODIFY payment_status ENUM(
    'pending',
    'paid',
    'failed',
    'cancelled',
    'refunded'
  ) DEFAULT 'pending',
  ADD COLUMN payment_provider VARCHAR(100) NULL AFTER payment_method,
  ADD COLUMN provider_payment_reference VARCHAR(191) NULL AFTER payment_status,
  ADD COLUMN provider_session_reference VARCHAR(191) NULL AFTER provider_payment_reference,
  ADD COLUMN payment_verified_at DATETIME NULL AFTER provider_session_reference;

CREATE UNIQUE INDEX ux_orders_provider_payment_reference
  ON orders (payment_provider, provider_payment_reference);

CREATE INDEX ix_orders_provider_session_reference
  ON orders (provider_session_reference);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  payment_provider VARCHAR(100) NOT NULL,
  provider_event_id VARCHAR(191) NOT NULL,
  event_type VARCHAR(191) NULL,
  order_id INT UNSIGNED NULL,
  payload_hash CHAR(64) NULL,
  processing_status ENUM(
    'received',
    'processed',
    'ignored',
    'failed'
  ) NOT NULL DEFAULT 'received',
  processed_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY ux_payment_webhook_provider_event (
    payment_provider,
    provider_event_id
  ),
  KEY ix_payment_webhook_order_id (order_id),
  CONSTRAINT payment_webhook_events_order_id_foreign
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
