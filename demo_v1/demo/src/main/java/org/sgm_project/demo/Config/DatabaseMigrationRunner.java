package org.sgm_project.demo.Config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseMigrationRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationRunner.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            // Drop legacy user_detail column if it exists in users table to prevent DataIntegrityViolation
            jdbcTemplate.execute("ALTER TABLE users DROP COLUMN IF EXISTS user_detail");
            log.info("Migration check: successfully ensured legacy column 'user_detail' is dropped from users table.");
        } catch (Exception e) {
            log.warn("Could not drop user_detail column via DROP COLUMN IF EXISTS: {}. Attempting fallback...", e.getMessage());
            try {
                jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN user_detail VARCHAR(255) NULL DEFAULT NULL");
                log.info("Fallback: modified legacy user_detail column to NULL DEFAULT NULL.");
            } catch (Exception ex) {
                log.debug("Fallback migration for user_detail skipped: {}", ex.getMessage());
            }
        }
    }
}

