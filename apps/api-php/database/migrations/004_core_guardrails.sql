-- M28: production-only module policy and strictly owner-scoped farm plots.
-- Apply AFTER 001, 002, 003 in an authorized MySQL 8 maintenance window.
-- Never executes as part of the default static DigiOps release.

CREATE TABLE IF NOT EXISTS production_module_flags (
 module_id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
 enabled TINYINT(1) NOT NULL DEFAULT 1,
 revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
 updated_by BIGINT UNSIGNED NULL,
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Idempotent initial policy; a subsequent migration MUST NOT re-enable disabled features.
INSERT INTO production_module_flags (module_id,enabled) VALUES
 (1,1),(2,1),(3,1),(4,1),(5,1),(6,1),(7,1),(8,1),(9,1),(10,1),
 (11,1),(12,1),(13,1),(14,1),(15,1),(16,1),(17,1),(18,1),(19,1),
 (20,1),(21,1),(22,1),(23,1),(24,1),(25,1)
 ON DUPLICATE KEY UPDATE module_id=VALUES(module_id);

CREATE TABLE IF NOT EXISTS farm_fields (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 owner_id BIGINT UNSIGNED NOT NULL,
 field_name VARCHAR(100) NOT NULL,
 district VARCHAR(100) NOT NULL,
 village VARCHAR(100) NOT NULL DEFAULT '',
 crop VARCHAR(100) NOT NULL,
 area_hectares DECIMAL(12,3) NOT NULL,
 status VARCHAR(16) NOT NULL DEFAULT 'active',
 revision BIGINT UNSIGNED NOT NULL DEFAULT 1,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
 FOREIGN KEY (owner_id) REFERENCES users(id),
 INDEX idx_farm_fields_owner (owner_id,status,created_at),
 CONSTRAINT chk_farm_field_area CHECK (area_hectares>0 AND area_hectares<=100000),
 CONSTRAINT chk_farm_field_status CHECK (status IN ('active','archived'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
