-- =====================================================================
-- WoundCarePro - Database Schema for MariaDB / MySQL
-- Designed for Local Deployment & Synology NAS (DS224+) MariaDB Package
-- =====================================================================

CREATE DATABASE IF NOT EXISTS wound_care_pro CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wound_care_pro;

-- -----------------------------------------------------
-- Table: patients
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    mrn VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: wounds
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS wounds (
    id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    x DECIMAL(5, 2) NOT NULL, -- percentage coordinate (0.00 to 100.00)
    y DECIMAL(5, 2) NOT NULL, -- percentage coordinate (0.00 to 100.00)
    view VARCHAR(10) DEFAULT 'front', -- 'front' or 'back'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'healed', 'chronic'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_wounds_patients FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: assessments (wound entries)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS assessments (
    id VARCHAR(36) NOT NULL,
    wound_id VARCHAR(36) NOT NULL,
    patient_id VARCHAR(36) NOT NULL,
    author_id VARCHAR(255) DEFAULT 'local-user',
    
    -- Dimensions (in cm)
    length DECIMAL(5, 2) DEFAULT NULL,
    width DECIMAL(5, 2) DEFAULT NULL,
    depth DECIMAL(5, 2) DEFAULT NULL,
    
    -- Characteristics
    edges VARCHAR(100) DEFAULT 'Diffus',
    phase VARCHAR(100) DEFAULT 'Granulation',
    exudate_amount VARCHAR(100) DEFAULT 'Kein',
    exudate_type VARCHAR(100) DEFAULT 'N/A',
    surroundings VARCHAR(100) DEFAULT 'Intakt',
    
    -- Therapy & Plan
    cleanser VARCHAR(255) DEFAULT 'NaCl 0.9%',
    filler VARCHAR(255) DEFAULT 'Keiner',
    dressing VARCHAR(255) DEFAULT 'Schaumverband',
    compression VARCHAR(10) DEFAULT 'Nein',
    compression_type VARCHAR(100) DEFAULT NULL,
    frequency VARCHAR(100) DEFAULT 'Täglich',
    
    -- Notes & Qualitative Data
    subjective_complaints TEXT DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    
    -- Base64 encoded wound images (or URLs)
    image_url LONGTEXT DEFAULT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    CONSTRAINT fk_assessments_wounds FOREIGN KEY (wound_id) 
        REFERENCES wounds(id) ON DELETE CASCADE,
    CONSTRAINT fk_assessments_patients FOREIGN KEY (patient_id) 
        REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Table: body_regions (for customizable Body Map regions)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS body_regions (
    id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    view VARCHAR(10) NOT NULL, -- 'front' or 'back'
    cx DECIMAL(5, 2) NOT NULL, -- relative center X %
    cy DECIMAL(5, 2) NOT NULL, -- relative center Y %
    r DECIMAL(5, 2) NOT NULL,  -- radius %
    type VARCHAR(50) DEFAULT 'circle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Indices for Query Performance optimization
-- -----------------------------------------------------
CREATE INDEX idx_wounds_patient ON wounds(patient_id);
CREATE INDEX idx_assessments_wound ON assessments(wound_id);
CREATE INDEX idx_assessments_patient ON assessments(patient_id);
