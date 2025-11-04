import { useState, useMemo, useRef, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Column,
} from '@tanstack/react-table';
import type { Food, FoodAllocation } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Edit, Trash2, ArrowUpDown, ChevronDown, Check, X, Search, Plus, Download, Upload } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import FoodLossEditorModal from './EditFoodModal';
import AddFoodModal from './AddFoodModal';

// Mock data
const mockFoods: Food[] = [
  {
    id: 'K01',
    origin_name: 'Chợ rẫy',
    name: 'TP1',
    unit: 'Chai',
    calorie_per_unit: 17500,
    calorie_usage: 7200,
    base_quantity: 10,
    hh_1_1_ratio: '1,000',
    hh_1_1_patient: 'BN1',
    hh_2_1_ratio: null,
    hh_2_1_patient: null,
    hh_2_2_ratio: null,
    hh_2_2_patient: null,
    hh_2_3_ratio: null,
    hh_2_3_patient: null,
    hh_3_1_ratio: '4,000',
    hh_3_1_patient: 'BN1',
    loss_ratio: '2,200',
    destination_id: 'dest1',
    destination_name: 'Xuất 1',
    insurance_type_id: 'ins1',
    insurance_type_name: 'Bảo hiểm',
    origin_id: 'origin1',
    apply_date: null,
    active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'K02',
    origin_name: 'YD1',
    name: 'TP2',
    unit: 'Gram',
    calorie_per_unit: 4070,
    calorie_usage: '21.4%',
    base_quantity: 100,
    hh_1_1_ratio: null,
    hh_1_1_patient: null,
    hh_2_1_ratio: null,
    hh_2_1_patient: null,
    hh_2_2_ratio: null,
    hh_2_2_patient: null,
    hh_2_3_ratio: null,
    hh_2_3_patient: null,
    hh_3_1_ratio: '15%',
    hh_3_1_patient: 'BN2',
    loss_ratio: '6%',
    destination_id: 'dest1',
    destination_name: 'Xuất 1',
    insurance_type_id: 'ins1',
    insurance_type_name: 'Bảo hiểm',
    origin_id: 'origin2',
    apply_date: null,
    active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'K03',
    origin_name: 'An bình',
    name: 'TP3',
    unit: 'Gram',
    calorie_per_unit: 4100,
    calorie_usage: '18.3%',
    base_quantity: 10,
    hh_1_1_ratio: null,
    hh_1_1_patient: null,
    hh_2_1_ratio: '2.0%',
    hh_2_1_patient: 'BN2',
    hh_2_2_ratio: '2.0%',
    hh_2_2_patient: 'BN2',
    hh_2_3_ratio: '2.0%',
    hh_2_3_patient: 'BN2',
    hh_3_1_ratio: '10.0%',
    hh_3_1_patient: 'BN3',
    loss_ratio: '2.3%',
    destination_id: 'dest3',
    destination_name: 'Xuất 3',
    insurance_type_id: 'ins1',
    insurance_type_name: 'Bảo hiểm',
    origin_id: 'origin3',
    apply_date: null,
    active: true,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

// Dropdown Filter cho cột có giá trị/null
function NullableDropdownFilter({ 
  column, 
}: { 
  column: Column<Food, unknown>; 
  data: Food[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const filterValue = column.getFilterValue() as string[] | undefined;
  
  // Tạo options: Có giá trị, Không có giá trị
  const options = ['Có giá trị', 'Không có giá trị'];
  
  // Close dropdown khi click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleValueToggle = (value: string) => {
    const currentFilter = filterValue || [];
    const newFilter = currentFilter.includes(value)
      ? currentFilter.filter(v => v !== value)
      : [...currentFilter, value];
    
    column.setFilterValue(newFilter.length === options.length ? undefined : newFilter);
  };
  
  const handleSelectAll = () => {
    column.setFilterValue(undefined);
  };
  
  const handleDeselectAll = () => {
    column.setFilterValue([]);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 hover:bg-gray-100"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-[9999] mt-1 w-52 bg-white border border-gray-200 rounded-md shadow-xl">
          <div className="p-3 border-b border-gray-100">
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="w-full justify-start h-7 text-xs font-normal"
              >
                <Check className="h-3 w-3 mr-2" />
                Chọn tất cả
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="w-full justify-start h-7 text-xs font-normal"
              >
                <X className="h-3 w-3 mr-2" />
                Bỏ chọn tất cả
              </Button>
            </div>
          </div>
          
          <div className="max-h-48 overflow-y-auto border-b border-gray-100">
            {options.map((value) => {
              const isSelected = !filterValue || filterValue.includes(value);
              return (
                <label
                  key={value}
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs border-b border-gray-50 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleValueToggle(value)}
                    className="mr-2 h-3 w-3"
                  />
                  <span className="truncate">{value}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Dropdown Filter Component giống Excel
function DropdownFilter({ 
  column, 
  data 
}: { 
  column: Column<Food, unknown>; 
  title: string;
  data: Food[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const columnId = column.id;
  const filterValue = column.getFilterValue() as string[] | undefined;
  
  // Lấy tất cả giá trị unique của cột
  const uniqueValues = useMemo(() => {
    const values = data.map(row => {
      const value = row[columnId as keyof Food];
      // Xử lý đặc biệt cho boolean (trạng thái)
      if (columnId === 'active') {
        return value ? 'Hoạt động' : 'Ngừng';
      }
      // Xử lý cho các cột number cần format
      if (columnId === 'calorie_per_unit' && typeof value === 'number') {
        return formatNumber(value);
      }
      if (columnId === 'calorie_usage' && typeof value === 'number') {
        return formatNumber(value);
      }
      return value ? String(value) : '';
    }).filter(Boolean);
    return Array.from(new Set(values)).sort();
  }, [data, columnId]);
  
  // Filter theo search term
  const filteredValues = useMemo(() => {
    if (!searchTerm) return uniqueValues;
    return uniqueValues.filter(value => 
      value.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [uniqueValues, searchTerm]);
  
  // Close dropdown khi click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleValueToggle = (value: string) => {
    const currentFilter = filterValue || [];
    const newFilter = currentFilter.includes(value)
      ? currentFilter.filter(v => v !== value)
      : [...currentFilter, value];
    
    column.setFilterValue(newFilter.length === uniqueValues.length ? undefined : newFilter);
  };
  
  const handleSelectAll = () => {
    column.setFilterValue(undefined);
  };
  
  const handleDeselectAll = () => {
    column.setFilterValue([]);
  };
  
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 hover:bg-gray-100"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      
      {isOpen && (
        <div className="absolute top-full left-0 z-[9999] mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-7 h-7 text-xs"
              />
            </div>
          </div>
          
          <div className="space-y-1 pt-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="w-full justify-start h-6 text-xs"
            >
              Chọn tất cả ({uniqueValues.length})
            </Button>
          </div>
          <div className="space-y-1 pb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeselectAll}
              className="w-full justify-start h-6 text-xs"
            >
              Bỏ chọn tất cả
            </Button>
          </div>
          
          <div className="max-h-48 overflow-y-auto">
            {filteredValues.map((value) => {
              const isSelected = !filterValue || filterValue.includes(value);
              return (
                <label
                  key={value}
                  className="flex items-center px-2 py-1 hover:bg-gray-50 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleValueToggle(value)}
                    className="mr-2 h-3 w-3"
                  />
                  <span className="truncate">{value}</span>
                </label>
              );
            })}
          </div>
          
          {filteredValues.length === 0 && (
            <div className="p-2 text-xs text-gray-500 text-center">
              Không tìm thấy kết quả
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FoodManagementTable() {
  const [data, setData] = useState<Food[]>(mockFoods);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleEditFood = (food: Food) => {
    setSelectedFood(food);
    setIsLossModalOpen(true);
  };

  const handleAddFood = () => {
    setIsAddModalOpen(true);
  };

  const handleSaveAllocations = (foodId: string, allocations: FoodAllocation[], updatedFood?: Partial<Food>) => {
    console.log('Save allocations for', foodId, allocations);
    
    // Update food data if provided
    if (updatedFood) {
      setData(prevData => 
        prevData.map(food => 
          food.id === foodId 
            ? { ...food, ...updatedFood, updated_at: Date.now() }
            : food
        )
      );
    }
    
    // TODO: Save allocations to backend when integrated
  };

  const handleSaveNewFood = (newFood: Omit<Food, 'id' | 'created_at' | 'updated_at'>) => {
    // Generate new ID
    const newId = `K${String(data.length + 1).padStart(2, '0')}`;
    
    const food: Food = {
      ...newFood,
      id: newId,
      created_at: Date.now(),
      updated_at: Date.now(),
    };

    setData(prev => [...prev, food]);
    console.log('Added new food:', food);
    // TODO: Save to backend when integrated
  };

  const columns = useMemo<ColumnDef<Food>[]>(
    () => [
      {
        accessorKey: 'id',
        header: ({ column }) => (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex-1"
            >
              Mã số
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
            <DropdownFilter column={column} title="Mã số" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="font-medium px-3 h-full flex items-center">{row.getValue('id')}</div>,
        size: 100,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          return value.includes(String(row.getValue(id)));
        },
      },
      {
        accessorKey: 'origin_name',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Nơi lấy mẫu</div>
            <DropdownFilter column={column} title="Nơi lấy mẫu" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('origin_name') || '-'}</div>,
        size: 130,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          const cellValue = row.getValue(id) as string;
          return value.includes(cellValue || '');
        },
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="flex-1"
            >
              Thực phẩm
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
            <DropdownFilter column={column} title="Thực phẩm" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('name')}</div>,
        size: 120,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          return value.includes(String(row.getValue(id)));
        },
      },
      {
        accessorKey: 'unit',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Đơn vị tính</div>
            <DropdownFilter column={column} title="Đơn vị tính" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('unit')}</div>,
        size: 100,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          return value.includes(String(row.getValue(id)));
        },
      },
      {
        accessorKey: 'calorie_per_unit',
        header: () => (
          <div className="px-3 py-2 text-xs font-medium">Giá trị</div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center justify-end">{formatNumber(row.getValue('calorie_per_unit'))}</div>,
        size: 100,
      },
      {
        accessorKey: 'calorie_usage',
        header: () => (
          <div className="px-3 py-2 text-xs font-medium bg-pink-100">Calo sử dụng</div>
        ),
        cell: ({ row }) => {
          const value = row.getValue('calorie_usage') as number | string | null;
          let display: string;
          if (typeof value === 'number') {
            display = formatNumber(value);
          } else if (value) {
            display = String(value);
          } else {
            display = '-';
          }
          return <div className="px-3 h-full flex items-center justify-end bg-pink-50">{display}</div>;
        },
        size: 120,
      },
      // HH 1.1 Group
      {
        id: 'hh_1_1_group',
        header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-yellow-100">HH 1.1</div>,
        columns: [
          {
            accessorKey: 'hh_1_1_ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <div className="text-xs font-medium">Tỉ lệ</div>
                <NullableDropdownFilter column={column} data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center justify-end">{row.getValue('hh_1_1_ratio') || ''}</div>,
            size: 90,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id);
              const hasValue = cellValue !== null && cellValue !== undefined && cellValue !== '';
              if (value.includes('Có giá trị') && hasValue) return true;
              if (value.includes('Không có giá trị') && !hasValue) return true;
              return false;
            },
          },
          {
            accessorKey: 'hh_1_1_patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <div className="text-xs font-medium">BN</div>
                <DropdownFilter column={column} title="Bệnh nhân" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center">{row.getValue('hh_1_1_patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id) as string;
              return value.includes(cellValue || '');
            },
          },
        ],
      },
      // HH 2.1 Group
      {
        id: 'hh_2_1_group',
        header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-green-100">HH 2.1</div>,
        columns: [
          {
            accessorKey: 'hh_2_1_ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <div className="text-xs font-medium">Tỉ lệ</div>
                <NullableDropdownFilter column={column} data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center justify-end">{row.getValue('hh_2_1_ratio') || ''}</div>,
            size: 90,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id);
              const hasValue = cellValue !== null && cellValue !== undefined && cellValue !== '';
              if (value.includes('Có giá trị') && hasValue) return true;
              if (value.includes('Không có giá trị') && !hasValue) return true;
              return false;
            },
          },
          {
            accessorKey: 'hh_2_1_patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <div className="text-xs font-medium">BN</div>
                <DropdownFilter column={column} title="Bệnh nhân" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center">{row.getValue('hh_2_1_patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id) as string;
              return value.includes(cellValue || '');
            },
          },
        ],
      },
      // HH 2.2 Group
      {
        id: 'hh_2_2_group',
        header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-yellow-100">HH 2.2</div>,
        columns: [
          {
            accessorKey: 'hh_2_2_ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <div className="text-xs font-medium">Tỉ lệ</div>
                <NullableDropdownFilter column={column} data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center justify-end">{row.getValue('hh_2_2_ratio') || ''}</div>,
            size: 90,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id);
              const hasValue = cellValue !== null && cellValue !== undefined && cellValue !== '';
              if (value.includes('Có giá trị') && hasValue) return true;
              if (value.includes('Không có giá trị') && !hasValue) return true;
              return false;
            },
          },
          {
            accessorKey: 'hh_2_2_patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <div className="text-xs font-medium">BN</div>
                <DropdownFilter column={column} title="Bệnh nhân" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center">{row.getValue('hh_2_2_patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id) as string;
              return value.includes(cellValue || '');
            },
          },
        ],
      },
      // HH 2.3 Group
      {
        id: 'hh_2_3_group',
        header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-green-100">HH 2.3</div>,
        columns: [
          {
            accessorKey: 'hh_2_3_ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <div className="text-xs font-medium">Tỉ lệ</div>
                <NullableDropdownFilter column={column} data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center justify-end">{row.getValue('hh_2_3_ratio') || ''}</div>,
            size: 90,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id);
              const hasValue = cellValue !== null && cellValue !== undefined && cellValue !== '';
              if (value.includes('Có giá trị') && hasValue) return true;
              if (value.includes('Không có giá trị') && !hasValue) return true;
              return false;
            },
          },
          {
            accessorKey: 'hh_2_3_patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <div className="text-xs font-medium">BN</div>
                <DropdownFilter column={column} title="Bệnh nhân" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center">{row.getValue('hh_2_3_patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id) as string;
              return value.includes(cellValue || '');
            },
          },
        ],
      },
      // HH 3.1 Group
      {
        id: 'hh_3_1_group',
        header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-yellow-100">HH 3.1</div>,
        columns: [
          {
            accessorKey: 'hh_3_1_ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <div className="text-xs font-medium">Tỉ lệ</div>
                <NullableDropdownFilter column={column} data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center justify-end">{row.getValue('hh_3_1_ratio') || ''}</div>,
            size: 90,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id);
              const hasValue = cellValue !== null && cellValue !== undefined && cellValue !== '';
              if (value.includes('Có giá trị') && hasValue) return true;
              if (value.includes('Không có giá trị') && !hasValue) return true;
              return false;
            },
          },
          {
            accessorKey: 'hh_3_1_patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <div className="text-xs font-medium">BN</div>
                <DropdownFilter column={column} title="Bệnh nhân" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center">{row.getValue('hh_3_1_patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => {
              if (!value || value.length === 0) return false;
              const cellValue = row.getValue(id) as string;
              return value.includes(cellValue || '');
            },
          },
        ],
      },
      // TL lỗ và các cột còn lại
      {
        accessorKey: 'loss_ratio',
        header: () => (
          <div className="px-3 py-2 text-xs font-medium bg-pink-100">Tỉ lệ</div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center justify-end bg-pink-50">{row.getValue('loss_ratio') || '-'}</div>,
        size: 100,
      },
      {
        accessorKey: 'destination_name',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Nơi xuất</div>
            <DropdownFilter column={column} title="Nơi xuất" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('destination_name') || '-'}</div>,
        size: 110,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          const cellValue = row.getValue(id) as string;
          return value.includes(cellValue || '');
        },
      },
      {
        accessorKey: 'insurance_type_name',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Loại hình</div>
            <DropdownFilter column={column} title="Loại hình" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('insurance_type_name') || '-'}</div>,
        size: 110,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          const cellValue = row.getValue(id) as string;
          return value.includes(cellValue || '');
        },
      },
      {
        accessorKey: 'apply_date',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Ngày áp dụng</div>
            <DropdownFilter column={column} title="Ngày áp dụng" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('apply_date') || '-'}</div>,
        size: 130,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          const cellValue = row.getValue(id) as string;
          return value.includes(cellValue || '');
        },
      },
      {
        accessorKey: 'active',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-3 py-2">
            <div className="text-xs font-medium">Trạng thái</div>
            <DropdownFilter column={column} title="Trạng thái" data={data} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            <span
              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                row.getValue('active')
                  ? 'bg-green-50 text-green-700'
                  : 'bg-gray-50 text-gray-700'
              }`}
            >
              {row.getValue('active') ? 'Hoạt động' : 'Ngừng'}
            </span>
          </div>
        ),
        size: 120,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          const cellValue = row.getValue(id) as boolean;
          const displayValue = cellValue ? 'Hoạt động' : 'Ngừng';
          return value.includes(displayValue);
        },
      },
      {
        id: 'actions',
        header: () => <div className="px-3 py-2 text-xs font-medium">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex gap-2 px-3 h-full items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditFood(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => console.log('Delete', row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
        size: 120,
      },
    ],
    [data]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Controls Row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm..."
            value={globalFilter ?? ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGlobalFilter('');
              setColumnFilters([]);
            }}
            className="whitespace-nowrap"
          >
            <X className="w-4 h-4" />
            Xóa bộ lọc
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Upload className="w-4 h-4" />
            Import Excel
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
          <Button size="sm" onClick={handleAddFood}>
            <Plus className="w-4 h-4" />
            Thêm mới
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto" style={{ overflow: 'visible' }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/30 h-8">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="text-center text-sm font-medium whitespace-nowrap h-8"
                    style={{ 
                      width: header.column.getSize(),
                      minWidth: header.column.getSize()
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b transition-colors hover:bg-muted/20 h-8"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td 
                      key={cell.id} 
                      className="text-xs h-8 p-0"
                      style={{ 
                        width: cell.column.getSize(),
                        minWidth: cell.column.getSize()
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-sm text-muted-foreground"
                >
                  Không có dữ liệu
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Hiển thị <strong>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} đến{' '}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{' '} </strong>
          trong tổng số <strong>{table.getFilteredRowModel().rows.length}</strong> dòng.
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Sau
          </Button>
        </div>
      </div>

      {/* Food Loss Editor Modal */}
      <FoodLossEditorModal
        food={selectedFood}
        open={isLossModalOpen}
        onOpenChange={setIsLossModalOpen}
        onSave={handleSaveAllocations}
      />

      {/* Add Food Modal */}
      <AddFoodModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleSaveNewFood}
      />
    </div>
  );
}

