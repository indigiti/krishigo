-- M20–M25 independent candidate schema (review-only; never auto-applied to Cloudways).
-- MySQL 8.0+/MariaDB 10.6+. Designed to be applied after 001_core.sql.
-- New public IDs are UUIDv7 strings; existing M8 user/listing/enquiry foreign keys remain BIGINT.
-- No real vendor, weather, IMD, APMC, OCR, AI or payment connector is enabled by this schema.

CREATE TABLE IF NOT EXISTS knowledge_sources (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 title VARCHAR(180) NOT NULL,
 publisher VARCHAR(120) NOT NULL,
 source_url VARCHAR(500) NOT NULL,
 jurisdiction VARCHAR(80) NOT NULL DEFAULT 'India',
 published_on DATE NULL,
 last_checked_at DATETIME NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'pending_review',
 submitted_by BIGINT UNSIGNED NOT NULL,
 reviewed_by BIGINT UNSIGNED NULL,
 reviewed_at DATETIME NULL,
 review_reason VARCHAR(400) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (submitted_by) REFERENCES users(id),
 FOREIGN KEY (reviewed_by) REFERENCES users(id),
 INDEX idx_knowledge_sources_review (status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS knowledge_articles (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 source_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 supersedes_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
 title VARCHAR(180) NOT NULL,
 crop VARCHAR(100) NOT NULL,
 topic VARCHAR(40) NOT NULL,
 language VARCHAR(8) NOT NULL,
 summary TEXT NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'pending_review',
 revision INT UNSIGNED NOT NULL DEFAULT 1,
 submitted_by BIGINT UNSIGNED NOT NULL,
 reviewed_by BIGINT UNSIGNED NULL,
 reviewed_at DATETIME NULL,
 review_reason VARCHAR(400) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (source_id) REFERENCES knowledge_sources(id),
 FOREIGN KEY (supersedes_id) REFERENCES knowledge_articles(id),
 FOREIGN KEY (submitted_by) REFERENCES users(id),
 FOREIGN KEY (reviewed_by) REFERENCES users(id),
 INDEX idx_articles_public (status,language,topic,crop,created_at),
 INDEX idx_articles_superseded (supersedes_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS source_data_snapshots (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 source_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 domain VARCHAR(24) NOT NULL,
 label VARCHAR(140) NOT NULL,
 payload_json JSON NOT NULL,
 observed_at DATETIME NOT NULL,
 valid_until DATETIME NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'pending_review',
 submitted_by BIGINT UNSIGNED NOT NULL,
 reviewed_by BIGINT UNSIGNED NULL,
 reviewed_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (source_id) REFERENCES knowledge_sources(id),
 FOREIGN KEY (submitted_by) REFERENCES users(id),
 FOREIGN KEY (reviewed_by) REFERENCES users(id),
 INDEX idx_snapshots_fresh (domain,status,valid_until,observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS farmer_profiles (
 user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
 district VARCHAR(100) NOT NULL DEFAULT '',
 preferred_language VARCHAR(8) NOT NULL DEFAULT 'en',
 crop_focus VARCHAR(120) NOT NULL DEFAULT '',
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS supplier_profiles (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 business_name VARCHAR(160) NOT NULL,
 district VARCHAR(100) NOT NULL,
 license_reference VARCHAR(140) NOT NULL DEFAULT '',
 status VARCHAR(24) NOT NULL DEFAULT 'pending_review',
 reviewed_by BIGINT UNSIGNED NULL,
 reviewed_at DATETIME NULL,
 review_reason VARCHAR(400) NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_supplier_user (user_id),
 FOREIGN KEY (user_id) REFERENCES users(id),
 FOREIGN KEY (reviewed_by) REFERENCES users(id),
 INDEX idx_supplier_status (status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_quotes (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 enquiry_id BIGINT UNSIGNED NOT NULL,
 listing_id BIGINT UNSIGNED NOT NULL,
 seller_id BIGINT UNSIGNED NOT NULL,
 buyer_id BIGINT UNSIGNED NOT NULL,
 quantity_kg DECIMAL(12,2) NOT NULL,
 total_inr DECIMAL(14,2) NOT NULL,
 terms VARCHAR(600) NOT NULL,
 expires_at DATETIME NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'offered',
 accepted_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_quote_enquiry (enquiry_id),
 FOREIGN KEY (enquiry_id) REFERENCES enquiries(id),
 FOREIGN KEY (listing_id) REFERENCES listings(id),
 FOREIGN KEY (seller_id) REFERENCES users(id),
 FOREIGN KEY (buyer_id) REFERENCES users(id),
 INDEX idx_quotes_seller (seller_id,status,created_at),
 INDEX idx_quotes_buyer (buyer_id,status,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS trade_orders (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 quote_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 seller_id BIGINT UNSIGNED NOT NULL,
 buyer_id BIGINT UNSIGNED NOT NULL,
 status VARCHAR(32) NOT NULL DEFAULT 'awaiting_seller_confirmation',
 confirmed_at DATETIME NULL,
 cancelled_at DATETIME NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_order_quote (quote_id),
 FOREIGN KEY (quote_id) REFERENCES trade_quotes(id),
 FOREIGN KEY (seller_id) REFERENCES users(id),
 FOREIGN KEY (buyer_id) REFERENCES users(id),
 INDEX idx_orders_party (seller_id,buyer_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS agronomy_intakes (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 crop VARCHAR(100) NOT NULL,
 observation VARCHAR(1200) NOT NULL,
 context_note VARCHAR(600) NOT NULL,
 kind VARCHAR(24) NOT NULL,
 evidence_url VARCHAR(500) NULL,
 status VARCHAR(32) NOT NULL DEFAULT 'pending_expert_review',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id),
 INDEX idx_agronomy_owner (user_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_preferences (
 user_id BIGINT UNSIGNED NOT NULL,
 topic VARCHAR(40) NOT NULL,
 channel VARCHAR(20) NOT NULL,
 opted_in TINYINT(1) NOT NULL DEFAULT 0,
 updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 PRIMARY KEY (user_id,topic,channel),
 FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification_events (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 user_id BIGINT UNSIGNED NOT NULL,
 topic VARCHAR(40) NOT NULL,
 title VARCHAR(140) NOT NULL,
 description VARCHAR(350) NOT NULL,
 status VARCHAR(24) NOT NULL DEFAULT 'in_app_only',
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (user_id) REFERENCES users(id),
 INDEX idx_notification_events (user_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS operations_audit (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 actor_id BIGINT UNSIGNED NOT NULL,
 action VARCHAR(80) NOT NULL,
 resource_type VARCHAR(40) NOT NULL,
 resource_uuid CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 reason VARCHAR(400) NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 FOREIGN KEY (actor_id) REFERENCES users(id),
 INDEX idx_operations_audit (resource_type,resource_uuid,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
