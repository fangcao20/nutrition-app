-- V001: Initial database schema
-- Creates all core tables for the nutrition tracking app

-- ========================================
-- CATEGORY TABLES
-- ========================================

-- Bảng danh mục: Nơi lấy mẫu
CREATE TABLE origins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng danh mục: Thực phẩm  
CREATE TABLE food_names (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng danh mục: Đơn vị tính
CREATE TABLE units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng danh mục: Nơi xuất
CREATE TABLE destinations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- Bảng danh mục: Loại hình
CREATE TABLE insurance_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT 1,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ========================================
-- MAIN TABLES
-- ========================================

-- Bảng chính: Thông số thực phẩm và hao hụt
CREATE TABLE foods (
  id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-increment primary key
  food_id TEXT UNIQUE,              -- Mã số từ Excel (K01, K02, K03...)
  origin_id INTEGER,                -- FK → origins
  food_name_id INTEGER,             -- FK → food_names
  unit_id INTEGER,                  -- FK → units
  calorie_per_unit REAL NOT NULL,   -- Giá trị calo/đơn vị
  calorie_usage TEXT,               -- Calo sử dụng (có thể là số hoặc % như "21.4%")
  
  -- Hao hụt HH 1.1
  hh_1_1_ratio TEXT,               -- Tỉ lệ HH 1.1 (có thể là "1,000" hoặc "15%")
  hh_1_1_patient TEXT,             -- Bệnh nhân HH 1.1
  
  -- Hao hụt HH 2.1
  hh_2_1_ratio TEXT,               -- Tỉ lệ HH 2.1
  hh_2_1_patient TEXT,             -- Bệnh nhân HH 2.1
  
  -- Hao hụt HH 2.2
  hh_2_2_ratio TEXT,               -- Tỉ lệ HH 2.2
  hh_2_2_patient TEXT,             -- Bệnh nhân HH 2.2
  
  -- Hao hụt HH 2.3
  hh_2_3_ratio TEXT,               -- Tỉ lệ HH 2.3
  hh_2_3_patient TEXT,             -- Bệnh nhân HH 2.3
  
  -- Hao hụt HH 3.1
  hh_3_1_ratio TEXT,               -- Tỉ lệ HH 3.1
  hh_3_1_patient TEXT,             -- Bệnh nhân HH 3.1
  
  -- Tỉ lệ lỗ
  loss_ratio TEXT,                 -- Tỉ lệ lỗ
  
  -- Metadata
  destination_id INTEGER,          -- FK → destinations
  insurance_type_id INTEGER,       -- FK → insurance_types
  apply_date DATE,                 -- Ngày áp dụng
  active BOOLEAN DEFAULT 1,        -- Còn sử dụng
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now')),
  
  -- Foreign key constraints
  FOREIGN KEY (origin_id) REFERENCES origins(id),
  FOREIGN KEY (food_name_id) REFERENCES food_names(id),
  FOREIGN KEY (unit_id) REFERENCES units(id),
  FOREIGN KEY (destination_id) REFERENCES destinations(id),
  FOREIGN KEY (insurance_type_id) REFERENCES insurance_types(id)
);

-- Migration tracking table (automatically created by migration runner)
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  filename TEXT NOT NULL,
  applied_at INTEGER DEFAULT (strftime('%s', 'now'))
);