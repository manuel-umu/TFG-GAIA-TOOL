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

-- INDICATOR
CREATE TABLE `indicators` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `dimension` varchar(100) NOT NULL,
  `formula` varchar(1000) NOT NULL,
  `goal` ENUM('Minimize', 'Maximize') NOT NULL,
  `measure` varchar(80) NOT NULL,
  `frequency` ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annual') NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`)
);

-- BUSINESS PROCESSES
CREATE TABLE `processes` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(70) NOT NULL,
  `type` ENUM('Strategic', 'Key', 'Support') NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `responsible` SMALLINT UNSIGNED NOT NULL,
  `deleted_at` DATETIME DEFAULT NULL,
  CONSTRAINT fk_responsible FOREIGN KEY (`responsible`) REFERENCES users(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY (`id`)
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
    CONSTRAINT fk_manager FOREIGN KEY (`manager`) REFERENCES users(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_auditor FOREIGN KEY (`auditor`) REFERENCES users(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_organization_audited FOREIGN KEY (`organization`) REFERENCES organizations(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (`id`),
    UNIQUE(`name`),
    CONSTRAINT chk_coeff_evaluated
    CHECK (NOT (state = 'Evaluated' AND coefficient IS NULL))
);

-- FACTOR
CREATE TABLE `factors` (
  `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(1000) NOT NULL,
  `organization` SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_org_for_factor FOREIGN KEY (`organization`) REFERENCES organizations(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (`id`)
);

-- RELATION: PROCESS - INDICATOR - FACTOR
CREATE TABLE `process_indicator_factor` (
  `factor` SMALLINT UNSIGNED NOT NULL,
  `indicator` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  CONSTRAINT fk_process FOREIGN KEY (`process`) REFERENCES processes(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT fk_indicator FOREIGN KEY (`indicator`) REFERENCES indicators(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT fk_factor FOREIGN KEY (`factor`) REFERENCES factors(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  PRIMARY KEY (`process`, `indicator`, `factor`)
);

CREATE TABLE `calculated_values_indicator` (
  `audit` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  `indicator` SMALLINT UNSIGNED NOT NULL,
  `real_value` DECIMAL(10,2) DEFAULT NULL,
  `ideal_value` DECIMAL(10,2) DEFAULT NULL,
  `normalized_value` DECIMAL(10,2) DEFAULT NULL,
  `weight` DECIMAL(10,2) DEFAULT NULL,
  CONSTRAINT fk_valueindicator_audit FOREIGN KEY (`audit`) REFERENCES audits(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_valueindicator_process FOREIGN KEY (`process`) REFERENCES processes(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT fk_valueindicator_indicator FOREIGN KEY (`indicator`) REFERENCES indicators(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  PRIMARY KEY (`audit`, `process`, `indicator`)
);

CREATE TABLE `calculated_values_process` (
    `audit` SMALLINT UNSIGNED NOT NULL,
    `process` SMALLINT UNSIGNED NOT NULL,
    `sustainability_index` DECIMAL(10,2) DEFAULT NULL,
    CONSTRAINT fk_valueProcess_audit FOREIGN KEY (`audit`) REFERENCES audits(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_valueProcess_process FOREIGN KEY (`process`) REFERENCES processes(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
    PRIMARY KEY (`audit`, `process`)
);

CREATE TABLE `calculated_element_matrix_saaty` (
  `audit` SMALLINT UNSIGNED NOT NULL,
  `process` SMALLINT UNSIGNED NOT NULL,
  `column_ind` SMALLINT UNSIGNED NOT NULL,
  `row_ind` SMALLINT UNSIGNED NOT NULL,
  `element` DECIMAL(10,3) NOT NULL,
  CONSTRAINT fk_elementmatrix_audit FOREIGN KEY (`audit`) REFERENCES audits(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_elementmatrix_process FOREIGN KEY (`process`) REFERENCES processes(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT fk_elementmatrix_column_ind FOREIGN KEY (`column_ind`) REFERENCES indicators(`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  CONSTRAINT fk_elementmatrix_row_ind FOREIGN KEY (`row_ind`) REFERENCES indicators(`id`) ON DELETE NO ACTION ON UPDATE CASCADE
);