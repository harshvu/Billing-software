-- ==========================================================
-- Billing Software - MySQL Schema
-- Note: Tables are also auto-created by Sequelize sync() on
-- server start. This file is provided for reference / manual
-- setup if you prefer creating the schema yourself.
-- ==========================================================

CREATE DATABASE IF NOT EXISTS billing_software CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE billing_software;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') NOT NULL DEFAULT 'employee',
  phone VARCHAR(50),
  branch VARCHAR(100),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS company_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL DEFAULT 'BUSINESSMINT SOLUTION FINANCIAL SERVICES PRIVATE LIMITED',
  gstin VARCHAR(50) DEFAULT '24AAOCR9991A1ZZ',
  phone VARCHAR(50) DEFAULT '+91 9724033596',
  address TEXT,
  logo_text VARCHAR(50) DEFAULT 'BUSINESSMINT SOLUTION',
  bank_account_name VARCHAR(255) DEFAULT 'BUSINESSMINT SOLUTION FINANCIAL SERVICES PVT LTD',
  bank_account_no VARCHAR(100) DEFAULT '404005000998',
  bank_ifsc VARCHAR(20) DEFAULT 'ICIC0004040',
  upi_id VARCHAR(100) DEFAULT 'rexer26340.ibz@icici',
  default_gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_type ENUM('proforma', 'tax') NOT NULL DEFAULT 'proforma',
  invoice_date DATE NOT NULL,
  branch VARCHAR(100),
  client_name VARCHAR(255) NOT NULL,
  client_address TEXT,
  client_phone VARCHAR(50),
  client_gstin VARCHAR(50),
  client_state VARCHAR(100),
  apply_gst BOOLEAN NOT NULL DEFAULT TRUE,
  gst_rate DECIMAL(5,2) NOT NULL DEFAULT 18.00,
  gst_type ENUM('igst', 'cgst_sgst', 'none') NOT NULL DEFAULT 'igst',
  sub_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  gst_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  grand_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  remarks TEXT,
  generated_by_id INT NOT NULL,
  generated_by_name VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  s_no INT NOT NULL,
  particulars VARCHAR(255) NOT NULL,
  hsn VARCHAR(20),
  qty DECIMAL(10,2) NOT NULL DEFAULT 1,
  rate DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB;
