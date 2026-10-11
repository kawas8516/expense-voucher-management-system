-- Expense Voucher Management System schema (PostgreSQL)

DROP TABLE IF EXISTS vouchers;
DROP TABLE IF EXISTS users;
DROP SEQUENCE IF EXISTS voucher_no_seq;

-- used for voucher numbers, never goes back even if a draft is deleted
CREATE SEQUENCE voucher_no_seq START 1;

CREATE TABLE users (
  id             SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20)  NOT NULL CHECK (role IN ('employee', 'director', 'accounts')),
  employee_code  VARCHAR(30),
  department     VARCHAR(100),
  signature_path VARCHAR(255),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE vouchers (
  id                 SERIAL PRIMARY KEY,
  voucher_no         VARCHAR(30) NOT NULL UNIQUE,
  voucher_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  expense_date       DATE NOT NULL,
  department         VARCHAR(100) NOT NULL,
  title              VARCHAR(150) NOT NULL,
  category           VARCHAR(50),
  description        TEXT,
  amount             NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  employee_id        INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  employee_signature VARCHAR(255),
  status             VARCHAR(20) NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  director_id        INT REFERENCES users(id),
  director_signature VARCHAR(255),
  submitted_at       TIMESTAMP,
  approved_at        TIMESTAMP,
  rejected_at        TIMESTAMP,
  rejection_reason   TEXT,
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vouchers_employee ON vouchers(employee_id);
CREATE INDEX idx_vouchers_status ON vouchers(status);
