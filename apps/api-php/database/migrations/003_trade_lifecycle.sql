-- M26: reversible, auditable internal farmer-to-buyer trade lifecycle.
-- Optional candidate migration; apply after 001_core.sql and 002_platform_foundations.sql.
-- Does NOT enable payment, legal settlement, real inventory, shipping, or external messages.

CREATE TABLE IF NOT EXISTS trade_activity (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 quote_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 order_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
 actor_id BIGINT UNSIGNED NOT NULL,
 event_type VARCHAR(40) NOT NULL,
 description VARCHAR(400) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 FOREIGN KEY (quote_id) REFERENCES trade_quotes(id),
 FOREIGN KEY (order_id) REFERENCES trade_orders(id),
 FOREIGN KEY (actor_id) REFERENCES users(id),
 INDEX idx_trade_activity_quote (quote_id,created_at,id),
 INDEX idx_trade_activity_order (order_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
