-- V003: Add database indexes for performance and constraints
-- Creates all necessary indexes for optimal query performance

-- ========================================
-- UNIQUE PRIMARY KEY INDEXES (automatically created by SQLite, but explicit for clarity)
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_origins_id ON origins(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_names_id ON food_names(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_id ON units(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_id ON destinations(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_insurance_types_id ON insurance_types(id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_id ON foods(id);

-- ========================================
-- UNIQUE CONSTRAINT INDEXES FOR CATEGORY NAMES
-- ========================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_origins_name ON origins(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_food_names_name ON food_names(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_name ON units(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_destinations_name ON destinations(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_insurance_types_name ON insurance_types(name);

-- ========================================
-- COMPOSITE UNIQUE CONSTRAINT FOR FOODS TABLE
-- ========================================

-- Ensure combination is unique only for active records (allows multiple inactive versions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_foods_composite_unique_active
  ON foods(food_id, origin_id, food_name_id, unit_id, calorie_per_unit) 
  WHERE active = 1;

-- ========================================
-- PERFORMANCE INDEXES FOR FOODS TABLE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_foods_food_id ON foods(food_id);
CREATE INDEX IF NOT EXISTS idx_foods_origin ON foods(origin_id);
CREATE INDEX IF NOT EXISTS idx_foods_food_name ON foods(food_name_id);
CREATE INDEX IF NOT EXISTS idx_foods_unit ON foods(unit_id);
CREATE INDEX IF NOT EXISTS idx_foods_destination ON foods(destination_id);
CREATE INDEX IF NOT EXISTS idx_foods_insurance_type ON foods(insurance_type_id);
CREATE INDEX IF NOT EXISTS idx_foods_active ON foods(active);
CREATE INDEX IF NOT EXISTS idx_foods_calorie_per_unit ON foods(calorie_per_unit);
CREATE INDEX IF NOT EXISTS idx_foods_apply_date ON foods(apply_date);

-- ========================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ========================================

-- Active foods by category
CREATE INDEX IF NOT EXISTS idx_foods_active_origin ON foods(active, origin_id);
CREATE INDEX IF NOT EXISTS idx_foods_active_food_name ON foods(active, food_name_id);
CREATE INDEX IF NOT EXISTS idx_foods_active_unit ON foods(active, unit_id);
