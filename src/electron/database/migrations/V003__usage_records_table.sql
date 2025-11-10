-- Drop existing usage_records table if it exists (to fix foreign key constraint)
DROP TABLE IF EXISTS usage_records;

-- Create usage_records table to store calculation results
CREATE TABLE usage_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  food_record_id INTEGER NOT NULL,
  sample_date TEXT NOT NULL,      -- Ngày lấy mẫu từ file Excel
  quantity REAL NOT NULL,         -- Số lượng
  import_month_year TEXT NOT NULL, -- Tháng/năm import để query (e.g., "2025-11")
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (food_record_id) REFERENCES foods(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_usage_records_food_id ON usage_records(food_record_id);
CREATE INDEX idx_usage_records_import_month ON usage_records(import_month_year);
CREATE INDEX idx_usage_records_sample_date ON usage_records(sample_date);