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

-- Independent link table avoids rewriting existing agronomy intake records.
-- Every link must be created inside the same transaction as its private intake.
CREATE TABLE IF NOT EXISTS farm_field_case_links (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 field_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 intake_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
 owner_id BIGINT UNSIGNED NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 UNIQUE KEY unique_case_link (intake_id),
 FOREIGN KEY (field_id) REFERENCES farm_fields(id),
 FOREIGN KEY (intake_id) REFERENCES agronomy_intakes(id),
 FOREIGN KEY (owner_id) REFERENCES users(id),
 INDEX idx_field_case_links (owner_id,field_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Immutable, UUIDv7 policy transitions; the resource is a module ID, not a fake UUID.
CREATE TABLE IF NOT EXISTS production_module_events (
 id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
 module_id TINYINT UNSIGNED NOT NULL,
 cause_module_id TINYINT UNSIGNED NOT NULL,
 actor_id BIGINT UNSIGNED NOT NULL,
 old_enabled TINYINT(1) NOT NULL,
 new_enabled TINYINT(1) NOT NULL,
 created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
 FOREIGN KEY (module_id) REFERENCES production_module_flags(module_id),
 FOREIGN KEY (cause_module_id) REFERENCES production_module_flags(module_id),
 FOREIGN KEY (actor_id) REFERENCES users(id),
 INDEX idx_policy_events_latest (created_at,id),
 INDEX idx_policy_events_module (module_id,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
