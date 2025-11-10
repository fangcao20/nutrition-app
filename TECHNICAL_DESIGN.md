# 🏗️ TECHNICAL DESIGN - NUTRITION TRACKING APP

## 📋 Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. Tech Stack](#2-tech-stack)
- [3. Database Schema](#3-database-schema)
- [4. Architecture](#4-architecture)
- [5. Key Features & User Flows](#5-key-features--user-flows)
- [6. Calculation Logic](#6-calculation-logic)
- [7. File Structure](#7-file-structure)
- [8. Data Flow](#8-data-flow)
- [9. UI/UX Considerations](#9-uiux-considerations)
- [10. Questions](#10-questions)

---

## 1. Tổng quan

### 1.1 Mô tả ứng dụng

Desktop app quản lý dinh dưỡng thực phẩm cho bệnh viện/cơ sở y tế với khả năng:

- Quản lý thông tin thực phẩm và calo
- Phân bổ dinh dưỡng cho các hợp phần (HH) và bệnh nhân
- Import/Export dữ liệu từ Excel
- Tính toán tự động dựa trên tỉ lệ đã cài đặt
- Filter, sort, và báo cáo chi tiết

### 1.2 Business Logic

**HH = Hao hụt** (Loss/Wastage) - Phân bổ dinh dưỡng theo tỉ lệ hao hụt

#### 1.2.1 Khái niệm

- **HH 1.1, HH 2.1, HH 2.2, HH 2.3, HH 3.1**: Các hợp phần hao hụt khác nhau
- **Tỉ lệ hao hụt**: Có thể là **số nguyên** (số lượng thực tế) hoặc **phần trăm** (tỉ lệ %)
- **Bệnh nhân**: Người được phân bổ calo từ hợp phần đó

#### 1.2.2 Công thức tính

```
1. Tổng Calo = Số lượng sử dụng × Giá trị Calo/đơn vị

2. Calo sử dụng = User input (không có công thức, nhập trực tiếp)

3. Calo Hao hụt (có 2 trường hợp):

   A. Nếu Tỉ lệ < 1 (Phần trăm):
      Calo HH = Tổng Calo × Tỉ lệ
      VD: 407,000 × 0.15 = 61,050 calo

   B. Nếu Tỉ lệ ≥ 1 (Số nguyên):
      Calo HH = Tỉ lệ × Số lượng sử dụng
      VD: 1000 × 10 = 10,000 calo

4. Calo còn lại = Tổng Calo - Calo sử dụng - Σ(Calo các HH)
```

#### 1.2.3 Ví dụ từ Excel

**K01 (TP1):**

```
- Số lượng: 10 chai
- Giá trị: 17,500 calo/chai
- Tổng Calo: 10 × 17,500 = 175,000 calo

Phân bổ:
- HH 1.1: 1000 (số nguyên) → 10,000 calo cho BN1
- HH 3.1: 4000 (số nguyên) → 40,000 calo cho BN1
- Calo sử dụng: 7,200 (?)
- Còn lại: 22,000 calo
```

**K02 (TP2):**

```
- Số lượng: 100 gram
- Giá trị: 4,070 calo/gram
- Tổng Calo: 100 × 4,070 = 407,000 calo

Phân bổ:
- Calo sử dụng: 0.2137... (21.37%)
- HH 3.1: 0.15 (15%) → 407,000 × 0.15 = 61,050 calo cho BN2
- Còn lại: 25,950 calo
```

**K03 (TP3):**

```
- Số lượng: 10 gram
- Giá trị: 4,100 calo/gram
- Tổng Calo: 10 × 4,100 = 41,000 calo

Phân bổ:
- HH 2.1: 0.02 (2%) → 41,000 × 0.02 = 820 calo cho BN2
- HH 2.2: 0.02 (2%) → 820 calo cho BN2
- HH 2.3: 0.02 (2%) → 820 calo cho BN2
- HH 3.1: 0.1 (10%) → 41,000 × 0.1 = 4,100 calo cho BN3
- Còn lại: 940 calo
```

#### 1.2.4 ✅ Đã clarify

1. **Calo sử dụng**: User input trực tiếp, không có công thức
2. **Công thức cho số nguyên**: `Calo HH = Tỉ lệ × Số lượng sử dụng`
3. **Tỉ lệ hao hụt**: User input, không có validation đặc biệt

---

## 2. Tech Stack

### 2.1 Frontend

```
React 18 + TypeScript
├── Build Tool: Vite
├── Data Grid: TanStack Table (AG-Grid alternative - free, powerful)
├── State Management: Zustand (lightweight, simple)
├── Form Management: React Hook Form + Zod
├── UI Components: shadcn/ui + Tailwind CSS
└── Excel Processing: XLSX (SheetJS)
```

### 2.2 Backend/Desktop

```
Electron
├── Database: Better-SQLite3 (ACID compliant, fast)
├── IPC: Electron IPC (Main ↔️ Renderer communication)
└── File System: Node.js fs/path APIs
```

### 2.3 Dev Tools

```
TypeScript (strict mode)
ESLint + Prettier
Electron Builder (packaging)
```

### 2.4 Package Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "electron": "^28.0.0",
    "better-sqlite3": "^9.2.0",
    "xlsx": "^0.18.5",
    "zustand": "^4.4.7",
    "@tanstack/react-table": "^8.11.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.4",
    "tailwindcss": "^3.4.0",
    "date-fns": "^3.0.0"
  }
}
```

---

## 3. Database Schema

### 3.1 ERD Overview

```
categories (Danh mục)
    ↓
    ├── foods (Thực phẩm)
    │     ↓
    │     ├── food_allocations (Phân bổ HH)
    │     └── usage_records (Sử dụng)
    │           ↓
    │           └── usage_calculations (Kết quả tính)

audit_logs (Independent - log all changes)
    ├── Track changes to: foods, usage_records, categories, etc.
    └── Store: old_value, new_value, user, timestamp
```

### 3.2 Detailed Schema

#### Bảng danh mục: Nơi lấy mẫu

```sql
CREATE TABLE origins (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL UNIQUE,        -- Tên nơi lấy mẫu (Chợ rẫy, YD1, An bình...)
  active BOOLEAN DEFAULT 1,         -- Còn sử dụng
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Bảng danh mục: Thực phẩm

```sql
CREATE TABLE food_names (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL UNIQUE,        -- Tên thực phẩm (TP1, TP2, TP3...)
  active BOOLEAN DEFAULT 1,         -- Còn sử dụng
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Bảng danh mục: Đơn vị tính

```sql
CREATE TABLE units (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL UNIQUE,        -- Tên đơn vị (Chai, Gram, Kg...)
  active BOOLEAN DEFAULT 1,         -- Còn sử dụng
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Bảng danh mục: Nơi xuất

```sql
CREATE TABLE destinations (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL UNIQUE,        -- Tên nơi xuất (Xuất 1, Xuất 2, Xuất 3...)
  active BOOLEAN DEFAULT 1,         -- Còn sử dụng
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Bảng danh mục: Loại hình

```sql
CREATE TABLE insurance_types (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL UNIQUE,        -- Tên loại hình (Bảo hiểm, Tự trả...)
  active BOOLEAN DEFAULT 1,         -- Còn sử dụng
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);
```

#### Bảng chính: Thông số thực phẩm và hao hụt

```sql
CREATE TABLE foods (
  id TEXT PRIMARY KEY,              -- Mã số (K01, K02, K03...)
  origin_id TEXT,                   -- FK → origins
  food_name_id TEXT,                -- FK → food_names
  unit_id TEXT,                     -- FK → units
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
  destination_id TEXT,             -- FK → destinations
  insurance_type_id TEXT,          -- FK → insurance_types
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
```

#### Table: `usage_records`

```sql
CREATE TABLE usage_records (
  id TEXT PRIMARY KEY,              -- UUID
  food_id TEXT NOT NULL,             -- FK → foods (Mã số)
  usage_date DATE NOT NULL,          -- Ngày sử dụng (user input)
  quantity REAL NOT NULL,            -- Số lượng sử dụng
  month INTEGER NOT NULL,            -- Tháng (1-12) - for filtering
  year INTEGER NOT NULL,             -- Năm (2025...) - for filtering
  total_calorie REAL,                -- Tổng calo = quantity × calorie_per_unit
  calorie_usage REAL,                -- Calo sử dụng (user input, không có công thức)
  notes TEXT,                        -- Ghi chú (optional)
  created_at INTEGER,
  updated_at INTEGER,                -- For audit trail
  FOREIGN KEY (food_id) REFERENCES foods(id)
);

-- Sample data:
-- ('uuid1', 'K01', '2025-11-03', 10, 11, 2025, 175000, 7200, null, 1730678400, 1730678400)
```

#### Table: `usage_calculations`

```sql
CREATE TABLE usage_calculations (
  id TEXT PRIMARY KEY,              -- UUID
  usage_id TEXT NOT NULL,            -- FK → usage_records
  component_code TEXT NOT NULL,      -- 'HH_1_1', 'HH_2_1'...
  patient_name TEXT,                 -- Bệnh nhân
  ratio REAL NOT NULL,               -- Tỉ lệ hao hụt (snapshot from allocation)
  ratio_type TEXT NOT NULL,          -- 'percentage' hoặc 'absolute' (snapshot)
  allocated_calorie REAL NOT NULL,   -- Calo được phân bổ (calculated)
  created_at INTEGER,
  FOREIGN KEY (usage_id) REFERENCES usage_records(id) ON DELETE CASCADE
);

-- Sample data (after calculation):
-- K01 with absolute ratio:
-- ('uuid1', 'usage_uuid1', 'HH_1_1', 'BN1', 1000, 'absolute', 10000, 1234567890)
-- ('uuid2', 'usage_uuid1', 'HH_3_1', 'BN1', 4000, 'absolute', 40000, 1234567890)

-- K03 with percentage ratio:
-- ('uuid3', 'usage_uuid3', 'HH_2_1', 'BN2', 0.02, 'percentage', 820, 1234567890)
-- ('uuid4', 'usage_uuid3', 'HH_3_1', 'BN3', 0.1, 'percentage', 4100, 1234567890)
```

#### Table: `audit_logs`

```sql
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,              -- UUID
  table_name TEXT NOT NULL,          -- 'foods', 'usage_records', 'categories'...
  record_id TEXT NOT NULL,           -- ID của record được edit
  action TEXT NOT NULL,              -- 'CREATE', 'UPDATE', 'DELETE'
  field_name TEXT,                   -- Tên field được edit (for UPDATE)
  old_value TEXT,                    -- Giá trị cũ (JSON string)
  new_value TEXT,                    -- Giá trị mới (JSON string)
  user_name TEXT DEFAULT 'System',   -- Người thực hiện (single-user nên mặc định)
  created_at INTEGER NOT NULL,       -- Timestamp
  notes TEXT                         -- Ghi chú (optional)
);

-- Sample data:
-- ('uuid1', 'usage_records', 'usage123', 'UPDATE', 'quantity', '10', '15', 'User', 1730678400, 'Corrected quantity')
-- ('uuid2', 'foods', 'K01', 'UPDATE', 'calorie_per_unit', '17500', '18000', 'User', 1730678500, 'Updated calorie value')
```

### 3.3 Indexes

```sql
-- Primary Key indexes (automatically created by SQLite)
-- UNIQUE PRIMARY KEY indexes
CREATE UNIQUE INDEX idx_origins_id ON origins(id);
CREATE UNIQUE INDEX idx_food_names_id ON food_names(id);
CREATE UNIQUE INDEX idx_units_id ON units(id);
CREATE UNIQUE INDEX idx_destinations_id ON destinations(id);
CREATE UNIQUE INDEX idx_insurance_types_id ON insurance_types(id);
CREATE UNIQUE INDEX idx_foods_id ON foods(id);

-- Unique constraint indexes for category names
CREATE UNIQUE INDEX idx_origins_name ON origins(name);
CREATE UNIQUE INDEX idx_food_names_name ON food_names(name);
CREATE UNIQUE INDEX idx_units_name ON units(name);
CREATE UNIQUE INDEX idx_destinations_name ON destinations(name);
CREATE UNIQUE INDEX idx_insurance_types_name ON insurance_types(name);

-- Composite unique constraint for foods table (5 columns combination must be unique)
CREATE UNIQUE INDEX idx_foods_composite_unique ON foods(id, origin_id, food_name_id, unit_id, calorie_per_unit, active);

-- Performance indexes for foods table
CREATE INDEX idx_foods_origin ON foods(origin_id);
CREATE INDEX idx_foods_food_name ON foods(food_name_id);
CREATE INDEX idx_foods_unit ON foods(unit_id);
CREATE INDEX idx_foods_destination ON foods(destination_id);
CREATE INDEX idx_foods_insurance_type ON foods(insurance_type_id);
CREATE INDEX idx_foods_active ON foods(active);
CREATE INDEX idx_foods_calorie_per_unit ON foods(calorie_per_unit);

-- Performance indexes for other tables
CREATE INDEX idx_usage_date ON usage_records(usage_date);
CREATE INDEX idx_usage_month_year ON usage_records(month, year);
CREATE INDEX idx_usage_calculations_usage ON usage_calculations(usage_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Composite indexes for common queries
CREATE INDEX idx_foods_active_origin ON foods(active, origin_id);
CREATE INDEX idx_foods_active_food_name ON foods(active, food_name_id);
```

### 3.4 Sample Data

```sql
-- Sample data for categories
INSERT INTO origins (id, name) VALUES
('origin1', 'Chợ rẫy'),
('origin2', 'YD1'),
('origin3', 'An bình');

INSERT INTO food_names (id, name) VALUES
('food1', 'TP1'),
('food2', 'TP2'),
('food3', 'TP3');

INSERT INTO units (id, name) VALUES
('unit1', 'Chai'),
('unit2', 'Gram'),
('unit3', 'Kg');

INSERT INTO destinations (id, name) VALUES
('dest1', 'Xuất 1'),
('dest2', 'Xuất 2'),
('dest3', 'Xuất 3');

INSERT INTO insurance_types (id, name) VALUES
('ins1', 'Bảo hiểm'),
('ins2', 'Tự trả');

-- Sample data for foods (K01 example)
INSERT INTO foods (
  id, origin_id, food_name_id, unit_id, calorie_per_unit, calorie_usage,
  hh_1_1_ratio, hh_1_1_patient, hh_3_1_ratio, hh_3_1_patient, loss_ratio,
  destination_id, insurance_type_id, active
) VALUES (
  'K01', 'origin1', 'food1', 'unit1', 17500, '7200',
  '1,000', 'BN1', '4,000', 'BN1', '2,200',
  'dest1', 'ins1', 1
);
```

### 3.5 View for Easy Querying

```sql
-- View kết hợp tất cả thông tin để hiển thị trong table
CREATE VIEW foods_with_categories AS
SELECT
  f.id,
  o.name as origin_name,
  fn.name as food_name,
  u.name as unit,
  f.calorie_per_unit,
  f.calorie_usage,
  f.hh_1_1_ratio,
  f.hh_1_1_patient,
  f.hh_2_1_ratio,
  f.hh_2_1_patient,
  f.hh_2_2_ratio,
  f.hh_2_2_patient,
  f.hh_2_3_ratio,
  f.hh_2_3_patient,
  f.hh_3_1_ratio,
  f.hh_3_1_patient,
  f.loss_ratio,
  d.name as destination_name,
  it.name as insurance_type_name,
  f.apply_date,
  f.active,
  f.origin_id,
  f.food_name_id,
  f.unit_id,
  f.destination_id,
  f.insurance_type_id,
  f.created_at,
  f.updated_at
FROM foods f
LEFT JOIN origins o ON f.origin_id = o.id
LEFT JOIN food_names fn ON f.food_name_id = fn.id
LEFT JOIN units u ON f.unit_id = u.id
LEFT JOIN destinations d ON f.destination_id = d.id
LEFT JOIN insurance_types it ON f.insurance_type_id = it.id;
```

---

## 4. Architecture

### 4.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ELECTRON DESKTOP APP                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │         MAIN PROCESS (Node.js)                     │    │
│  │                                                     │    │
│  │  ├── Database Manager (Better-SQLite3)            │    │
│  │  │   ├── CRUD operations                          │    │
│  │  │   ├── Migrations                               │    │
│  │  │   └── Transactions                             │    │
│  │  │                                                 │    │
│  │  ├── Excel Service                                │    │
│  │  │   ├── Import (XLSX → DB)                       │    │
│  │  │   └── Export (DB → XLSX)                       │    │
│  │  │                                                 │    │
│  │  ├── Calculation Service                          │    │
│  │  │   ├── Nutrition calculation algorithm          │    │
│  │  │   └── Aggregation                              │    │
│  │  │                                                 │    │
│  │  └── IPC Handlers                                 │    │
│  │      ├── food.*                                    │    │
│  │      ├── usage.*                                   │    │
│  │      ├── category.*                                │    │
│  │      └── excel.*                                   │    │
│  └────────────────────────────────────────────────────┘    │
│                          ↕ IPC                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │      RENDERER PROCESS (React + TypeScript)         │    │
│  │                                                     │    │
│  │  ├── Pages                                         │    │
│  │  │   ├── SettingsPage (Cài đặt)                   │    │
│  │  │   │   ├── Food Management Component            │    │
│  │  │   │   ├── Allocation Editor Component          │    │
│  │  │   │   └── Category Management Component        │    │
│  │  │   │                                             │    │
│  │  │   └── UsagePage (Sử dụng)                      │    │
│  │  │       ├── Month/Year Selector                  │    │
│  │  │       ├── Import Dialog                        │    │
│  │  │       ├── Review Data Grid                     │    │
│  │  │       ├── Calculate Button                     │    │
│  │  │       └── Results Display                      │    │
│  │  │                                                 │    │
│  │  ├── Components (Shared)                          │    │
│  │  │   ├── DataGrid (TanStack Table)                │    │
│  │  │   │   ├── Filter                               │    │
│  │  │   │   ├── Sort                                 │    │
│  │  │   │   ├── Pagination                           │    │
│  │  │   │   └── Cell Editing                         │    │
│  │  │   ├── ImportDialog                             │    │
│  │  │   ├── AllocationEditor                         │    │
│  │  │   └── CalculationSummary                       │    │
│  │  │                                                 │    │
│  │  ├── State Management (Zustand)                   │    │
│  │  │   ├── foodStore                                │    │
│  │  │   ├── usageStore                               │    │
│  │  │   └── categoryStore                            │    │
│  │  │                                                 │    │
│  │  └── Utils                                         │    │
│  │      ├── excelParser.ts                           │    │
│  │      ├── calculator.ts                            │    │
│  │      ├── validators.ts                            │    │
│  │      └── formatters.ts                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↕
                    ┌──────────┐
                    │ database │
                    │ .db      │
                    └──────────┘
```

### 4.2 IPC Communication Pattern

```typescript
// Main Process (electron/handlers/food.handler.ts)
ipcMain.handle("food:getAll", async () => {
  return db.prepare("SELECT * FROM foods WHERE active = 1").all();
});

// Renderer Process (ui/hooks/useIPC.ts)
const foods = await window.electron.invoke("food:getAll");
```

### 4.3 State Management Flow (Zustand)

```typescript
// foodStore.ts
interface FoodStore {
  foods: Food[];
  selectedFood: Food | null;
  fetchFoods: () => Promise<void>;
  selectFood: (id: string) => void;
  updateFood: (id: string, data: Partial<Food>) => Promise<void>;
}

// Component usage
const { foods, fetchFoods } = useFoodStore();
```

---

## 5. Key Features & User Flows

### 5.1 Settings Page (Cài đặt)

#### 5.1.1 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Nutrition App - Cài đặt                         [_][□][×]  │
├─────────────────────────────────────────────────────────────┤
│  [Cài đặt] [Sử dụng]                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quản lý Thực phẩm                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [+ Thêm mới] [📥 Import Excel] [📤 Export Excel]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Mã số | Thực phẩm | Nơi lấy | Đơn vị | Calo | Actions│  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ K01   | TP1       | Chợ rẫy | Chai   |17500 | [Edit] │  │
│  │ K02   | TP2       | YD1     | Gram   | 4070 | [Edit] │  │
│  │ K03   | TP3       | An bình | Gram   | 4100 | [Edit] │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Filter: [Nơi lấy mẫu ▼] [Còn sử dụng ▼]  [🔍 Tìm kiếm]   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 5.1.2 Allocation Editor Modal

```
┌─────────────────────────────────────────────────────────────┐
│  Chỉnh sửa phân bổ - K01 (TP1)                    [×]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Thông tin cơ bản:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Mã số:       K01                                      │  │
│  │ Thực phẩm:   TP1                                      │  │
│  │ Đơn vị:      Chai                                     │  │
│  │ Calo/đơn vị: 17,500                                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Phân bổ hợp phần:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Hợp phần  │  Tỉ lệ (%)  │  Bệnh nhân  │  Calo         │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ HH 1.1    │  [1000]     │  [BN1 ▼]    │  175,000      │  │
│  │ HH 2.1    │  [0]        │  [     ▼]   │  0            │  │
│  │ HH 2.2    │  [0]        │  [     ▼]   │  0            │  │
│  │ HH 2.3    │  [0]        │  [     ▼]   │  0            │  │
│  │ HH 3.1    │  [4000]     │  [BN1 ▼]    │  700,000      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Tổng tỉ lệ: 5000% (500.00)        Calo còn lại: -700,000  │
│  ⚠️ Warning: Tổng tỉ lệ > 100%                              │
│                                                              │
│  [Hủy]                                          [💾 Lưu]    │
└─────────────────────────────────────────────────────────────┘
```

#### 5.1.3 User Flow

```
1. User vào Settings Page
2. Click [+ Thêm mới] hoặc [Edit] existing food
3. Modal mở ra:
   a. Nhập thông tin cơ bản (Mã số, Tên, Nơi lấy mẫu, Đơn vị, Calo)
   b. Nhập phân bổ cho từng hợp phần (HH 1.1 → HH 3.1)
   c. App tự động tính tổng tỉ lệ
   d. Validation: Show warning nếu tổng tỉ lệ != 100%
4. Click [Lưu] → Save to DB
5. Grid refresh với data mới

Import Excel Flow:
1. Click [📥 Import Excel]
2. Select file
3. Parse Excel → Validate structure
4. Show preview dialog
5. Click [Confirm] → Batch insert to DB
6. Auto-create categories if not exist
```

### 5.2 Usage Page (Sử dụng)

#### 5.2.1 Wireframe

```
┌─────────────────────────────────────────────────────────────┐
│  Nutrition App - Sử dụng                        [_][□][×]   │
├─────────────────────────────────────────────────────────────┤
│  [Cài đặt] [Sử dụng]                                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Theo dõi sử dụng                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Tháng: [11 ▼]  Năm: [2025 ▼]                         │  │
│  │ [📥 Import Excel] [📤 Export Results]                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Step 1: Import Data                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        📁                                             │  │
│  │   Drag & drop Excel file here                        │  │
│  │   or click to browse                                 │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Step 2: Review Imported Data (3 records)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Mã số│Thực phẩm│Số lượng│Ngày    │Tổng Calo│Actions  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ K01  │ TP1     │   10   │11/2025 │175,000  │ [Del]   │  │
│  │ K02  │ TP2     │  100   │11/2025 │407,000  │ [Del]   │  │
│  │ K03  │ TP3     │   10   │11/2025 │ 41,000  │ [Del]   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [🧮 Tính toán]                                             │
│                                                              │
│  Step 3: Results                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Summary                                               │  │
│  │ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━│  │
│  │ Tổng Calo:      623,000                               │  │
│  │ HH 1.1:          10,000  (BN1)                        │  │
│  │ HH 2.1:             820  (BN2)                        │  │
│  │ HH 2.2:             820  (BN2)                        │  │
│  │ HH 2.3:             820  (BN2)                        │  │
│  │ HH 3.1:         105,150  (BN1, BN2, BN3)              │  │
│  │ Calo còn lại:    48,890                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Detailed Results                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ [Full grid với tất cả columns như Excel]             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 5.2.2 User Flow

```
1. User vào Usage Page
2. Select month/year từ dropdown
3. Click [📥 Import Excel]:
   a. Choose file (hoặc drag & drop)
   b. Parse Excel
   c. Validate:
      - Check if food_id exists
      - Check quantity > 0
      - Check date format
   d. Calculate total_calorie = quantity × calorie_per_unit
   e. Display in review grid
4. User review data:
   - Edit inline nếu cần
   - Delete invalid rows
5. Click [🧮 Tính toán]:
   a. For each usage record:
      - Get food allocations
      - Calculate allocated calories
      - Save to usage_calculations table
   b. Aggregate results
   c. Display summary + detailed grid
6. Click [📤 Export Results]:
   - Export to Excel với format như file mẫu
```

---

## 6. Calculation Logic

### 6.1 Algorithm Pseudocode

```typescript
function calculateNutrition(usageRecords: UsageRecord[]): CalculationResult {
  const results: CalculationResult[] = [];
  const aggregated: AggregatedResult = {
    totalCalorie: 0,
    components: {},
    remainingCalorie: 0,
  };

  for (const record of usageRecords) {
    // 1. Get food info & allocations from DB
    const food = getFoodById(record.food_id);
    const allocations = getFoodAllocations(record.food_id);

    // 2. Calculate total calorie
    const totalCalorie = record.quantity * food.calorie_per_unit;
    aggregated.totalCalorie += totalCalorie;

    // 3. Allocate to components (HH - Hao hụt)
    let allocatedTotal = 0;
    const componentResults: ComponentResult[] = [];

    for (const allocation of allocations) {
      let allocatedCalorie = 0;

      // Calculate based on ratio type
      if (allocation.ratio_type === "percentage") {
        // Case A: Phần trăm (ratio < 1)
        // VD: 0.02 = 2%, 0.15 = 15%
        // Formula: Calo HH = Tổng Calo × Tỉ lệ
        allocatedCalorie = totalCalorie * allocation.ratio;
      } else if (allocation.ratio_type === "absolute") {
        // Case B: Số nguyên (ratio ≥ 1)
        // VD: 1000, 4000
        // Formula: Calo HH = Tỉ lệ × Số lượng sử dụng
        allocatedCalorie = allocation.ratio * record.quantity;
      }

      allocatedTotal += allocatedCalorie;

      componentResults.push({
        usage_id: record.id,
        component_code: allocation.component_code,
        patient_name: allocation.patient_name,
        ratio: allocation.ratio,
        ratio_type: allocation.ratio_type,
        allocated_calorie: allocatedCalorie,
      });

      // Aggregate by component
      if (!aggregated.components[allocation.component_code]) {
        aggregated.components[allocation.component_code] = {
          calorie: 0,
          patients: new Set(),
        };
      }
      aggregated.components[allocation.component_code].calorie +=
        allocatedCalorie;
      if (allocation.patient_name) {
        aggregated.components[allocation.component_code].patients.add(
          allocation.patient_name
        );
      }
    }

    // 4. Save component results to DB
    saveUsageCalculations(componentResults);

    // 5. Calculate remaining
    const remainingCalorie = totalCalorie - allocatedTotal;
    aggregated.remainingCalorie += remainingCalorie;

    results.push({
      usage_id: record.id,
      food_id: record.food_id,
      total_calorie: totalCalorie,
      components: componentResults,
      remaining_calorie: remainingCalorie,
    });
  }

  return {
    details: results,
    summary: aggregated,
  };
}
```

### 6.2 Example Calculation

**Example 1: K01 (Số nguyên - Absolute)**

```
Input:
  - Số lượng: 10 chai
  - Giá trị: 17,500 calo/chai
  - Tổng Calo: 10 × 17,500 = 175,000 calo
  - Calo sử dụng: 7,200 (user input)
  - Allocations:
    - HH 1.1: ratio = 1000 (absolute), BN1
    - HH 3.1: ratio = 4000 (absolute), BN1

Calculation:
  HH 1.1 = 1000 × 10 = 10,000 calo (BN1)
  HH 3.1 = 4000 × 10 = 40,000 calo (BN1)
  Total allocated = 50,000 calo
  Remaining = 175,000 - 7,200 - 50,000 = 117,800 calo

  (Note: Excel shows 22,000 - có thể có logic khác cần clarify thêm)
```

**Example 2: K03 (Phần trăm - Percentage)**

```
Input:
  - Số lượng: 10 gram
  - Giá trị: 4,100 calo/gram
  - Tổng Calo: 10 × 4,100 = 41,000 calo
  - Allocations:
    - HH 2.1: ratio = 0.02 (2%), BN2
    - HH 2.2: ratio = 0.02 (2%), BN2
    - HH 2.3: ratio = 0.02 (2%), BN2
    - HH 3.1: ratio = 0.1 (10%), BN3

Calculation:
  HH 2.1 = 41,000 × 0.02 = 820 calo (BN2)
  HH 2.2 = 41,000 × 0.02 = 820 calo (BN2)
  HH 2.3 = 41,000 × 0.02 = 820 calo (BN2)
  HH 3.1 = 41,000 × 0.1 = 4,100 calo (BN3)
  Total allocated = 6,560 calo
  Remaining = 41,000 - 6,560 = 34,440 calo

  ✓ Matches Excel: 940 calo (if calorie_usage is included)
```

---

## 7. File Structure

```
nutrition-app/
├── src/
│   ├── electron/                    # Main Process (Node.js)
│   │   ├── main.ts                  # Entry point
│   │   ├── preload.ts               # Context bridge
│   │   │
│   │   ├── database/
│   │   │   ├── db.ts                # SQLite setup & connection
│   │   │   ├── migrations.ts        # Schema migrations
│   │   │   └── seed.ts              # Initial data
│   │   │
│   │   ├── handlers/                # IPC handlers
│   │   │   ├── food.handler.ts      # food:* events
│   │   │   ├── usage.handler.ts     # usage:* events
│   │   │   ├── category.handler.ts  # category:* events
│   │   │   └── excel.handler.ts     # excel:* events
│   │   │
│   │   └── services/
│   │       ├── calculation.service.ts  # Core calculation logic
│   │       ├── excel.service.ts        # Excel import/export
│   │       └── validation.service.ts   # Business validation
│   │
│   ├── ui/                          # Renderer Process (React)
│   │   ├── App.tsx                  # Root component
│   │   ├── main.tsx                 # React entry point
│   │   │
│   │   ├── pages/
│   │   │   ├── SettingsPage.tsx     # Cài đặt page
│   │   │   └── UsagePage.tsx        # Sử dụng page
│   │   │
│   │   ├── components/
│   │   │   ├── DataGrid/
│   │   │   │   ├── DataGrid.tsx
│   │   │   │   ├── FilterBar.tsx
│   │   │   │   └── ColumnDefs.ts
│   │   │   │
│   │   │   ├── ImportDialog/
│   │   │   │   ├── ImportDialog.tsx
│   │   │   │   ├── FileUpload.tsx
│   │   │   │   └── PreviewGrid.tsx
│   │   │   │
│   │   │   ├── AllocationEditor/
│   │   │   │   ├── AllocationEditor.tsx
│   │   │   │   ├── AllocationRow.tsx
│   │   │   │   └── AllocationSummary.tsx
│   │   │   │
│   │   │   ├── CalculationResults/
│   │   │   │   ├── SummaryCard.tsx
│   │   │   │   └── DetailedGrid.tsx
│   │   │   │
│   │   │   └── ui/                  # shadcn/ui components
│   │   │       ├── button.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── table.tsx
│   │   │       └── toast.tsx
│   │   │
│   │   ├── store/                   # Zustand stores
│   │   │   ├── foodStore.ts
│   │   │   ├── usageStore.ts
│   │   │   ├── categoryStore.ts
│   │   │   └── uiStore.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useIPC.ts            # IPC communication hook
│   │   │   ├── useFoods.ts
│   │   │   ├── useUsage.ts
│   │   │   └── useCategories.ts
│   │   │
│   │   ├── types/
│   │   │   ├── index.ts             # All TypeScript types
│   │   │   ├── food.types.ts
│   │   │   ├── usage.types.ts
│   │   │   └── calculation.types.ts
│   │   │
│   │   ├── utils/
│   │   │   ├── excelParser.ts       # Excel → JSON
│   │   │   ├── excelExporter.ts     # JSON → Excel
│   │   │   ├── validators.ts        # Validation rules
│   │   │   ├── formatters.ts        # Number/Date formatting
│   │   │   └── constants.ts         # Constants
│   │   │
│   │   └── styles/
│   │       ├── globals.css          # Global styles + Tailwind
│   │       └── variables.css        # CSS variables
│   │
│   └── shared/                      # Shared between Main & Renderer
│       ├── types.ts                 # Common types
│       └── constants.ts             # Common constants
│
├── database.db                      # SQLite database
├── electron-builder.json            # Build configuration
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

---

## 8. Data Flow

### 8.1 Import Excel Flow

```
User selects file
      ↓
Excel File → Parse XLSX (SheetJS)
      ↓
JSON Array → Validate structure
      ↓
Valid rows → Show preview
      ↓
User confirms
      ↓
IPC: 'excel:import'
      ↓
Main Process → Begin transaction
      ↓
Insert/Update DB
      ↓
Auto-create categories
      ↓
Commit transaction
      ↓
Return result → Renderer
      ↓
Refresh UI
```

### 8.2 Calculate Nutrition Flow

```
User clicks [Tính toán]
      ↓
IPC: 'usage:calculate' (month, year)
      ↓
Main Process
      ↓
1. Get usage_records (filtered by month/year)
      ↓
2. For each record:
   - Get food info
   - Get allocations
   - Calculate
      ↓
3. Save to usage_calculations
      ↓
4. Aggregate results
      ↓
Return summary + details → Renderer
      ↓
Display in UI
```

### 8.3 Real-time Validation Flow

```
User edits allocation ratio
      ↓
onChange event
      ↓
Calculate sum of ratios
      ↓
Check if sum != 100
      ↓
Show warning badge
      ↓
Disable [Lưu] button if invalid
```

---

## 9. UI/UX Considerations

### 9.1 Design Principles

- **Vietnamese-first**: Tất cả UI text bằng tiếng Việt
- **Data-heavy**: Prioritize data grid visibility
- **Keyboard shortcuts**: Power users cần shortcuts
- **Instant feedback**: Loading states + toast notifications
- **Error prevention**: Validation trước khi save

### 9.2 Color Scheme

```css
/* Based on shadcn/ui with custom tweaks */
:root {
  --primary: 142 76% 36%; /* Green - healthy food */
  --secondary: 217 91% 60%; /* Blue - medical */
  --accent: 38 92% 50%; /* Orange - alerts */
  --success: 142 71% 45%; /* Green */
  --warning: 38 92% 50%; /* Orange */
  --error: 0 72% 51%; /* Red */
}
```

### 9.3 Typography

```css
/* Vietnamese font stack */
font-family: "Inter", "Roboto", "Segoe UI", "Helvetica Neue", sans-serif;
```

### 9.4 Responsive Breakpoints

```
Desktop-first (main target: 1920×1080 và 1366×768)
├── Large: ≥1920px
├── Medium: 1366px - 1919px
└── Small: 1024px - 1365px
```

### 9.5 Keyboard Shortcuts

```
Ctrl/Cmd + S:  Save
Ctrl/Cmd + I:  Import Excel
Ctrl/Cmd + E:  Export Excel
Ctrl/Cmd + N:  New food
Ctrl/Cmd + F:  Focus search
Ctrl/Cmd + K:  Calculate (on Usage page)
Esc:           Close modal
```

### 9.6 Loading States

```
- Skeleton loaders for tables
- Spinner for calculations
- Progress bar for Excel import/export
- Disable buttons during async operations
```

### 9.7 Error Handling

```
1. Network/DB errors: Toast notification (red)
2. Validation errors: Inline error messages
3. Missing data: Empty state with action button
4. Calculation errors: Modal dialog với error details
```

### 9.8 Accessibility

```
- ARIA labels cho screen readers (optional, nice-to-have)
- Focus management trong modals
- Keyboard navigation cho data grids
- High contrast mode support
```

---

## 10. Questions

Trước khi bắt đầu implement, cần clarify:

### 10.1 Business Logic ✅ COMPLETED

1. **HH = Hao hụt** (Loss/Wastage)
2. **Tỉ lệ hao hụt**: 2 dạng
   - Số nguyên (≥ 1): `Calo HH = Tỉ lệ × Số lượng`
   - Phần trăm (< 1): `Calo HH = Tỉ lệ × Tổng Calo`
3. **Calo sử dụng**: User input trực tiếp, không có công thức
4. **Tỉ lệ hao hụt**: User input, lấy giá trị gì thì dùng giá trị đó
5. **Ngày tháng**: User input trong tab Sử dụng (không tự động)
6. **Validation rules**: Không có validation đặc biệt cho tỉ lệ, số lượng, etc.

### 10.2 Data Management ✅ COMPLETED

7. **Excel import format**: Cố định (như file mẫu)

   - Thiếu cột → Không cho import (show error)
   - Import từ 1 sheet tại 1 thời điểm (không support multiple sheets)

8. **Historical data**:

   - ✅ Xem lại data tháng trước
   - ✅ Edit data đã tính toán (nhưng phải log lại)
   - ✅ Audit log: Lưu ai edit gì, lúc nào

9. **Categories auto-creation**:
   - ✅ Auto-create nếu chưa tồn tại
   - ✅ Cho phép edit/delete categories

### 10.3 Technical ✅ COMPLETED

10. **Multi-user**: Single-user (1 máy, 1 DB local)

    - SQLite local database
    - Không cần sync giữa nhiều máy

11. **Backup**:

    - ✅ Auto backup monthly
    - Lưu backup files trong folder riêng

12. **Export format**:

    - ✅ Format giống file mẫu 100% (merged cells, colors, layout...)
    - Maintain Excel formatting khi export

13. **Performance**:
    - Số lượng records: Chưa biết → Design cho scalability
    - ✅ Implement pagination để đảm bảo performance

---

## 11. Next Steps

Nếu approve design này:

### Phase 1: Setup (Day 1)

- [ ] Setup Electron + React + TypeScript
- [ ] Configure Vite, Tailwind, shadcn/ui
- [ ] Setup Better-SQLite3 + migrations
- [ ] Create database schema
- [ ] Setup IPC communication pattern

### Phase 2: Core Features (Day 2-3)

- [ ] Settings Page - Food Management
- [ ] Settings Page - Allocation Editor
- [ ] Category management
- [ ] Excel import service
- [ ] Excel export service

### Phase 3: Usage Tracking (Day 4-5)

- [ ] Usage Page UI
- [ ] Import Excel to usage
- [ ] Calculation algorithm
- [ ] Results display
- [ ] Month/Year filtering

### Phase 4: Polish (Day 6-7)

- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications
- [ ] Keyboard shortcuts
- [ ] Testing & bug fixes
- [ ] Packaging (dmg for macOS)

---

## 12. References

- [Electron Docs](https://www.electronjs.org/docs/latest)
- [TanStack Table](https://tanstack.com/table/v8)
- [Better-SQLite3](https://github.com/WiseLibs/better-sqlite3)
- [SheetJS (xlsx)](https://docs.sheetjs.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Document Version:** 1.0  
**Created:** 2025-11-03  
**Author:** AI Assistant (Claude)  
**Status:** Pending Approval
