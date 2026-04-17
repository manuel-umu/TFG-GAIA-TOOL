CREATE SCHEMA IF NOT EXISTS app_db;

USE app_db;

-- USER
CREATE TABLE `users` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` varchar(70) NOT NULL,
  `password` varchar(200) NOT NULL,
  `name` varchar(70) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` ENUM('admin', 'chief_auditor', 'evaluator_auditor') NOT NULL DEFAULT 'evaluator_auditor',
  `first_second_name` varchar(50) DEFAULT NULL,
  `recovery_code` INT DEFAULT NULL,
  `code_expiry` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE(`username`),
  UNIQUE(`email`)
);

-- ORGANIZATION
CREATE TABLE `organizations` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(70) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `country` varchar(70) NOT NULL,
  `sector` varchar(50) NOT NULL,
  `rangeEmployees` varchar(50) DEFAULT NULL,
  `website` varchar(200) NOT NULL,
  `goals` varchar(2000) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE(`name`)
);

-- FRAMEWORK
CREATE TABLE `frameworks` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `issuing_body` VARCHAR(100) NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE(`code`)
);

-- FRAMEWORK VERSION
CREATE TABLE `framework_versions` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `framework_id` SMALLINT UNSIGNED NOT NULL,
  `version_code` VARCHAR(30) NOT NULL,
  `version_label` VARCHAR(100) NOT NULL,
  `effective_date` DATE DEFAULT NULL,
  `source_file` VARCHAR(200) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fw_version` (`framework_id`, `version_code`),
  CONSTRAINT `fk_fv_framework` FOREIGN KEY (`framework_id`) REFERENCES `frameworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- STANDARD
CREATE TABLE `standards` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `framework_version_id` SMALLINT UNSIGNED NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `category` VARCHAR(100) DEFAULT NULL,
  `is_mandatory` TINYINT(1) NOT NULL DEFAULT 0,
  `sort_order` SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_standard` (`framework_version_id`, `code`),
  CONSTRAINT `fk_std_fv` FOREIGN KEY (`framework_version_id`) REFERENCES `framework_versions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- DISCLOSURE REQUIREMENT
CREATE TABLE `disclosure_requirements` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `standard_id` SMALLINT UNSIGNED NOT NULL,
  `code` VARCHAR(30) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `sort_order` SMALLINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dr` (`standard_id`, `code`),
  CONSTRAINT `fk_dr_standard` FOREIGN KEY (`standard_id`) REFERENCES `standards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- DATA POINT
CREATE TABLE `datapoints` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `disclosure_requirement_id` INT UNSIGNED NOT NULL,
  `official_id` VARCHAR(30) NOT NULL,
  `name` VARCHAR(500) NOT NULL,
  `paragraph_ref` VARCHAR(30) DEFAULT NULL,
  `related_ar` VARCHAR(100) DEFAULT NULL,
  `data_type` VARCHAR(30) DEFAULT NULL,
  `is_voluntary` TINYINT(1) NOT NULL DEFAULT 0,
  `is_conditional` TINYINT(1) NOT NULL DEFAULT 0,
  `phased_in_750` TINYINT(1) NOT NULL DEFAULT 0,
  `phased_in_appendix_c` TINYINT(1) NOT NULL DEFAULT 0,
  `cross_reference` VARCHAR(200) DEFAULT NULL,
  `link` VARCHAR(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE(`official_id`),
  CONSTRAINT `fk_dp_dr` FOREIGN KEY (`disclosure_requirement_id`) REFERENCES `disclosure_requirements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- INDICATOR
CREATE TABLE `indicators` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `data_point_id` INT UNSIGNED DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `dimension` varchar(100) NOT NULL,
  `formula` varchar(1000) NOT NULL,
  `goal` ENUM('Minimize', 'Maximize') NOT NULL,
  `measure` varchar(80) NOT NULL,
  `frequency` ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual') NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_indicator_datapoint` FOREIGN KEY (`data_point_id`) REFERENCES `datapoints`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- BUSINESS PROCESSES
CREATE TABLE `processes` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(70) NOT NULL,
  `type` ENUM('Strategic', 'Key', 'Support') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `responsible` SMALLINT UNSIGNED NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_responsible` FOREIGN KEY (`responsible`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AUDITS
CREATE TABLE `audits` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `init_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `frequency` ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual') NOT NULL,
  `state` ENUM('Not started', 'Pending', 'Evaluated', 'Closed', 'Not evaluated') NOT NULL DEFAULT 'Not started',
  `description` VARCHAR(500) DEFAULT NULL,
  `coefficient` DECIMAL(10,2) DEFAULT NULL,
  `auditor` SMALLINT UNSIGNED NOT NULL,
  `manager` SMALLINT UNSIGNED NOT NULL,
  `organization` SMALLINT UNSIGNED NOT NULL,
  `framework_version_id` SMALLINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE(`name`),
  CONSTRAINT `fk_manager` FOREIGN KEY (`manager`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_auditor` FOREIGN KEY (`auditor`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_organization_audited` FOREIGN KEY (`organization`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_audit_fv` FOREIGN KEY (`framework_version_id`) REFERENCES `framework_versions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `chk_coeff_evaluated` CHECK (NOT (state = 'Evaluated' AND coefficient IS NULL))
);

-- FACTOR
CREATE TABLE `factors` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(1000) NOT NULL,
  `organization` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_org_for_factor` FOREIGN KEY (`organization`) REFERENCES `organizations`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

-- RELATION: PROCESS - INDICATOR - FACTOR
CREATE TABLE `process_indicator_factor` (
  `factor` SMALLINT UNSIGNED NOT NULL,
  `indicator` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (`process`, `indicator`, `factor`),
  CONSTRAINT `fk_process` FOREIGN KEY (`process`) REFERENCES `processes`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_indicator` FOREIGN KEY (`indicator`) REFERENCES `indicators`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_factor` FOREIGN KEY (`factor`) REFERENCES `factors`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE `calculated_values_indicator` (
  `audit` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  `indicator` SMALLINT UNSIGNED NOT NULL,
  `real_value` DECIMAL(10,2) DEFAULT NULL,
  `ideal_value` DECIMAL(10,2) DEFAULT NULL,
  `normalized_value` DECIMAL(10,2) DEFAULT NULL,
  `weight` DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (`audit`, `process`, `indicator`),
  CONSTRAINT `fk_valueindicator_audit` FOREIGN KEY (`audit`) REFERENCES `audits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_valueindicator_process` FOREIGN KEY (`process`) REFERENCES `processes`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_valueindicator_indicator` FOREIGN KEY (`indicator`) REFERENCES `indicators`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE TABLE `calculated_values_process` (
  `audit` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  `sustainability_index` DECIMAL(10,2) DEFAULT NULL,
  PRIMARY KEY (`audit`, `process`),
  CONSTRAINT `fk_valueProcess_audit` FOREIGN KEY (`audit`) REFERENCES `audits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_valueProcess_process` FOREIGN KEY (`process`) REFERENCES `processes`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE
);

CREATE TABLE `calculated_element_matrix_saaty` (
  `audit` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  `column_ind` SMALLINT UNSIGNED NOT NULL,
  `row_ind` SMALLINT UNSIGNED NOT NULL,
  `element` DECIMAL(10,3) NOT NULL,
  CONSTRAINT `fk_elementmatrix_audit` FOREIGN KEY (`audit`) REFERENCES `audits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_elementmatrix_process` FOREIGN KEY (`process`) REFERENCES `processes`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_elementmatrix_column_ind` FOREIGN KEY (`column_ind`) REFERENCES `indicators`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT `fk_elementmatrix_row_ind` FOREIGN KEY (`row_ind`) REFERENCES `indicators`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE
);

-- Evaluación de materialidad por estándar
CREATE TABLE `audit_standards` (
  `audit_id` SMALLINT UNSIGNED NOT NULL,
  `standard_id` SMALLINT UNSIGNED NOT NULL,
  `is_material` TINYINT(1) NOT NULL DEFAULT 0,
  `justification` TEXT DEFAULT NULL,
  `assessed_by` SMALLINT UNSIGNED DEFAULT NULL,
  `assessed_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`audit_id`, `standard_id`),
  CONSTRAINT `fk_as_audit` FOREIGN KEY (`audit_id`) REFERENCES `audits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_as_standard` FOREIGN KEY (`standard_id`) REFERENCES `standards`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_as_user` FOREIGN KEY (`assessed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Respuestas a data points concretos en una auditoría
CREATE TABLE `audit_datapoints` (
  `audit_id` SMALLINT UNSIGNED NOT NULL,
  `data_point_id` INT UNSIGNED NOT NULL,
  `value_text` TEXT DEFAULT NULL,
  `value_numeric` DECIMAL(15,4) DEFAULT NULL,
  `is_applicable` TINYINT(1) NOT NULL DEFAULT 1,
  `evidence_reference` VARCHAR(255) DEFAULT NULL,
  `status` ENUM('pending', 'draft', 'completed', 'validated') NOT NULL DEFAULT 'pending',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `updated_by` SMALLINT UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`audit_id`, `data_point_id`),
  CONSTRAINT `fk_adp_audit` FOREIGN KEY (`audit_id`) REFERENCES `audits`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_adp_datapoint` FOREIGN KEY (`data_point_id`) REFERENCES `datapoints`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_adp_user` FOREIGN KEY (`updated_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
);
