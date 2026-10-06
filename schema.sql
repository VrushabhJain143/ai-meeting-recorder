-- =======================================================
-- AI Meeting Recorder - MySQL Database Schema
-- Run this script in MySQL Workbench, phpMyAdmin, or CLI
-- =======================================================

CREATE TABLE IF NOT EXISTS recordings (
  id VARCHAR(64) PRIMARY KEY,
  created_at VARCHAR(64) NOT NULL,
  duration INT NOT NULL DEFAULT 0,
  audio_file_path VARCHAR(255) NOT NULL,
  transcript LONGTEXT,
  summary LONGTEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'processing',
  error_message TEXT,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
