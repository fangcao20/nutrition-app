import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
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
  Row,
} from '@tanstack/react-table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Edit, ArrowUpDown, ChevronDown, X, Search, Upload, Power, Download } from 'lucide-react';
import { formatNumber } from '../lib/utils';
import FoodLossEditorModal from './EditFoodModal';
import type { FoodWithCategories, ImportError } from '../../../types/food';

// Format ratio values: if < 1 show as percentage with 2 decimal places
const formatRatio = (value: string | null | undefined): string => {
  if (!value || value === '') return '';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return value;
  
  if (numValue < 1) {
    return `${(numValue * 100).toFixed(2)}%`;
  }
  
  return formatNumber(numValue);
};

const textFilter = (row: Row<FoodWithCategories>, id: string, value: string[]) => {
  if (!value || value.length === 0) return false;
  const cellValue = row.getValue(id);
  const isEmpty = cellValue === null || cellValue === undefined || cellValue === '';
  
  if (value.includes('(Trống)') && isEmpty) return true;
  if (!isEmpty && value.includes(formatRatio(String(cellValue)))) return true;
  
  return false;
}

const numberFilter = (row: Row<FoodWithCategories>, id: string, filter: any) => {
  const cellValue = row.getValue(id);
  if (filter === undefined) return true;
  if (filter === 'empty') {
    return cellValue === null || cellValue === undefined || cellValue === '';
  }
  if (typeof filter === 'object') {
    const floatCellValue = parseFloat(String(cellValue));
    if (filter.op === 'equals') {
      return floatCellValue === filter.value;
    }
    if (filter.op === 'lt') {
      return floatCellValue < filter.value;
    }
    if (filter.op === 'gt') {
      return floatCellValue > filter.value;
    }
    if (filter.op === 'between') {
      return floatCellValue >= filter.min && floatCellValue <= filter.max;
    }
  }
  return true;
}

// Enhanced Dropdown Filter Component with blank value support
function DropdownFilter({ 
  column, 
  data 
}: { 
  column: Column<FoodWithCategories, unknown>; 
  title: string;
  data: FoodWithCategories[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const buttonRef = useRef<HTMLDivElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);
  
  const columnId = column.id;
  const filterValue = column.getFilterValue() as string[] | undefined;
  
  // Lấy tất cả giá trị unique của cột, bao gồm cả giá trị trống
  const uniqueValues = useMemo(() => {
    const values = data.map(row => {
      const value = row[columnId as keyof FoodWithCategories];
      // Xử lý đặc biệt cho boolean (trạng thái)
      if (columnId === 'active') {
        return value ? 'Hoạt động' : 'Ngừng';
      }
      // Xử lý cho các cột number cần format
      if (columnId === 'caloriePerUnit' && typeof value === 'number') {
        return formatNumber(value);
      }
      if (columnId === 'calorieUsage' && typeof value === 'number') {
        return formatNumber(value);
      }
      return value ? String(value) : '';
    });
    
    const nonEmptyValues = values.filter(Boolean);
    const hasEmptyValues = values.some(v => !v);
    
    const result = Array.from(new Set(nonEmptyValues)).sort();
    
    // Thêm option cho giá trị trống nếu có
    if (hasEmptyValues) {
      result.unshift('(Trống)');
    }
    
    return result;
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
      const target = event.target as Node;
      if (
        buttonRef.current && buttonRef.current.contains(target)
      ) {
        return;
      }
      if (
        portalDropdownRef.current && portalDropdownRef.current.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
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
  
  // Get button position for portal dropdown
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number} | null>(null);
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <div className="inline-block" ref={buttonRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 hover:bg-gray-100"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      {isOpen && dropdownPos && ReactDOM.createPortal(
        <div
          ref={portalDropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            width: '16rem',
          }}
          className="bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
        >
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
                  className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-xs"
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
        </div>,
        document.body
      )}
    </div>
  );
}

// Number Filter Component for numeric columns
function NumberFilter({ column }: { column: Column<FoodWithCategories, unknown> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [operator, setOperator] = useState<'equals'|'lt'|'gt'|'between'|'empty'>('equals');
  const [value, setValue] = useState('');
  const [secondValue, setSecondValue] = useState('');
  const buttonRef = useRef<HTMLDivElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current && buttonRef.current.contains(target)
      ) {
        return;
      }
      if (
        portalDropdownRef.current && portalDropdownRef.current.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleApplyFilter = () => {
    if (operator === 'empty') {
      column.setFilterValue('empty');
    } else if (operator === 'equals') {
      column.setFilterValue(value ? { op: 'equals', value: parseFloat(value) } : undefined);
    } else if (operator === 'lt') {
      column.setFilterValue(value ? { op: 'lt', value: parseFloat(value) } : undefined);
    } else if (operator === 'gt') {
      column.setFilterValue(value ? { op: 'gt', value: parseFloat(value) } : undefined);
    } else if (operator === 'between') {
      if (value && secondValue) {
        column.setFilterValue({ op: 'between', min: parseFloat(value), max: parseFloat(secondValue) });
      } else {
        column.setFilterValue(undefined);
      }
    }
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    setValue('');
    setSecondValue('');
    setOperator('equals');
    column.setFilterValue(undefined);
    setIsOpen(false);
  };
  
  // Get button position for portal dropdown
  const [dropdownPos, setDropdownPos] = useState<{top: number, left: number} | null>(null);
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  return (
    <div className="inline-block" ref={buttonRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-6 w-6 p-0 hover:bg-gray-100"
      >
        <ChevronDown className="h-3 w-3" />
      </Button>
      {isOpen && dropdownPos && ReactDOM.createPortal(
        <div
          ref={portalDropdownRef}
          style={{
            position: 'absolute',
            top: dropdownPos.top,
            left: dropdownPos.left,
            zIndex: 9999,
            width: '18rem',
          }}
          className="bg-white border border-gray-200 rounded-md shadow-xl p-3"
        >
          <div className="space-y-3">
            <div className="text-xs font-medium text-gray-700">Lọc theo số</div>
            <div className="mb-2">
              <select
                className="border rounded px-2 py-1 text-xs w-full"
                value={operator}
                onChange={e => setOperator(e.target.value as any)}
              >
                <option value="equals">Bằng (=)</option>
                <option value="lt">Nhỏ hơn (&lt;)</option>
                <option value="gt">Lớn hơn (&gt;)</option>
                <option value="between">Trong khoảng</option>
                <option value="empty">Trống</option>
              </select>
            </div>
            {operator === 'equals' && (
              <Input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Nhập số..."
                className="h-7 text-xs mb-2"
              />
            )}
            {operator === 'lt' && (
              <Input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Nhỏ hơn..."
                className="h-7 text-xs mb-2"
              />
            )}
            {operator === 'gt' && (
              <Input
                type="number"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="Lớn hơn..."
                className="h-7 text-xs mb-2"
              />
            )}
            {operator === 'between' && (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="Từ..."
                  className="h-7 text-xs"
                />
                <Input
                  type="number"
                  value={secondValue}
                  onChange={e => setSecondValue(e.target.value)}
                  placeholder="Đến..."
                  className="h-7 text-xs"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApplyFilter}
                className="flex-1 h-7 text-xs"
              >
                Áp dụng
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilter}
                className="flex-1 h-7 text-xs"
              >
                Xóa
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Reusable Sort Button Component
function SortButton({ 
  column, 
  children 
}: { 
  column: Column<FoodWithCategories, unknown>;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
      className="flex-1 px-1 py-1 h-6 text-xs"
    >
      {children}
      <ArrowUpDown className="ml-1 h-3 w-3" />
    </Button>
  );
}

export default function FoodManagementTable() {
  const [data, setData] = useState<FoodWithCategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodWithCategories | null>(null);
  const [isLossModalOpen, setIsLossModalOpen] = useState(false);
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [showImportErrors, setShowImportErrors] = useState(false);

  const loadFoods = useCallback(async () => {
    try {
      setLoading(true);
      // Check if electronAPI is available
      if (!window.electronAPI) {
        console.error('ElectronAPI not available');
        setData([]); // No fallback data
        return;
      }
      
      const foods = await window.electronAPI.food.getAll();
      setData(foods || []);
    } catch (error) {
      console.error('Error loading foods:', error);
      setData([]);
      alert('Lỗi khi tải dữ liệu thực phẩm');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const handleEditFood = (food: FoodWithCategories) => {
    setSelectedFood(food);
    setIsLossModalOpen(true);
  };

  // Temporarily commented out
  // const handleAddFood = () => {
  //   setIsAddModalOpen(true);
  // };

  const handleDeactivateFood = useCallback(async (food: FoodWithCategories) => {
    if (!window.electronAPI) {
      alert('ElectronAPI not available');
      return;
    }

    const confirmMessage = food.active 
      ? `Bạn có chắc chắn muốn ngừng hoạt động thực phẩm "${food.foodName}" (${food.foodId})?`
      : `Bạn có chắc chắn muốn kích hoạt lại thực phẩm "${food.foodName}" (${food.foodId})?`;
    
    if (confirm(confirmMessage)) {
      try {
        setLoading(true);
        const success = await window.electronAPI.food.updateStatus(food.id, !food.active);
        
        if (success) {
          // Reload data after update
          await loadFoods();
          
          const successMessage = food.active 
            ? 'Thực phẩm đã được ngừng hoạt động'
            : 'Thực phẩm đã được kích hoạt lại';
          alert(successMessage);
        } else {
          alert('Không thể cập nhật trạng thái thực phẩm');
        }
      } catch (error) {
        console.error('Error updating food status:', error);
        
        // Check if error is due to UNIQUE constraint violation
        const errorMessage = String(error);
        if (errorMessage.includes('UNIQUE constraint') || errorMessage.includes('unique')) {
          alert(
            `❌ Không thể kích hoạt thực phẩm này!\n\n` +
            `Đã có một thực phẩm tương tự (cùng mã số, nơi lấy mẫu, tên thực phẩm, đơn vị và giá trị calo) đang ở trạng thái hoạt động.\n\n` +
            `Vui lòng ngừng hoạt động thực phẩm trùng lặp trước khi kích hoạt thực phẩm này.`
          );
        } else {
          alert('Lỗi khi cập nhật trạng thái thực phẩm');
        }
      } finally {
        setLoading(false);
      }
    }
  }, [loadFoods]);

  const handleSaveFood = useCallback(async (updatedFood: Partial<FoodWithCategories>) => {
    if (!selectedFood || !window.electronAPI) {
      alert('ElectronAPI not available or no food selected');
      return;
    }

    try {
      setLoading(true);
      const success = await window.electronAPI.food.update(selectedFood.id, updatedFood);
      
      if (success) {
        // Reload data after update
        await loadFoods();
        alert('Cập nhật thực phẩm thành công');
      } else {
        alert('Không thể cập nhật thực phẩm');
      }
    } catch (error) {
      console.error('Error updating food:', error);
      alert('Lỗi khi cập nhật thực phẩm');
    } finally {
      setLoading(false);
    }
  }, [selectedFood, loadFoods]);

  const handleImportExcel = async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.dialog.showOpenDialog({
        title: 'Chọn file Excel để import',
        filters: [
          { name: 'Excel Files', extensions: ['xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const importResult = await window.electronAPI.food.importFromExcel(filePath);
        
        if (importResult.success) {
          alert(`🎉 Import thành công! Đã import ${importResult.imported} dòng dữ liệu.`);
          // Reload data
          await loadFoods();
          // Clear any previous errors
          setImportErrors([]);
          setShowImportErrors(false);
        } else {
          // Show errors in table instead of alert
          setImportErrors(importResult.errors);
          setShowImportErrors(true);
          
          // More informative summary message
          const successMsg = importResult.imported > 0 
            ? `✅ Import thành công ${importResult.imported} dòng` 
            : '';
          const errorMsg = `❌ ${importResult.errors.length} dòng bị lỗi`;
          const combinedMsg = successMsg 
            ? `${successMsg}, ${errorMsg.toLowerCase()}. Xem chi tiết lỗi trong bảng bên dưới.`
            : `${errorMsg}. Xem chi tiết lỗi trong bảng bên dưới.`;
          
          alert(combinedMsg);
          
          // Still reload data to show imported items
          if (importResult.imported > 0) {
            await loadFoods();
          }
        }
      }
    } catch (error) {
      console.error('Error importing Excel:', error);
      alert(`Lỗi import: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo<ColumnDef<FoodWithCategories>[]>(
    () => [
      {
        accessorKey: 'foodId',
        header: ({ column }) => (
          <div className="flex items-center justify-between">
            <SortButton column={column}>Mã số</SortButton>
            <DropdownFilter column={column} title="Mã số" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="font-medium px-3 h-full flex items-center">{row.getValue('foodId')}</div>,
        size: 100,
        filterFn: (row, id, value: string[]) => {
          if (!value || value.length === 0) return false;
          return value.includes(String(row.getValue(id)));
        },
      },
      {
        accessorKey: 'originName',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Nơi lấy mẫu</SortButton>
            <DropdownFilter column={column} title="Nơi lấy mẫu" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('originName') || '-'}</div>,
        size: 130,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'foodName',
        header: ({ column }) => (
          <div className="flex items-center justify-between">
            <SortButton column={column}>Thực phẩm</SortButton>
            <DropdownFilter column={column} title="Thực phẩm" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('foodName')}</div>,
        size: 120,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'unit',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Đơn vị tính</SortButton>
            <DropdownFilter column={column} title="Đơn vị tính" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('unit')}</div>,
        size: 100,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'caloriePerUnit',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Giá trị</SortButton>
            <NumberFilter column={column} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center justify-end">{formatNumber(row.getValue('caloriePerUnit'))}</div>,
        size: 100,
        filterFn: (row, id, filter) => numberFilter(row, id, filter),
      },
      // Calo sử dụng Group
      {
        id: 'calorie_usage_group',
        header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-pink-100">Calo sử dụng</div>,
        columns: [
          {
            accessorKey: 'calorieUsage',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-pink-100">
                <SortButton column={column}>Tỉ lệ</SortButton>
                <NumberFilter column={column} />
              </div>
            ),
            cell: ({ row }) => {
              const value = row.getValue('calorieUsage') as number | string | null;
              let display: string;
              if (typeof value === 'number') {
                display = formatRatio(String(value));
              } else if (value) {
                display = formatRatio(String(value));
              } else {
                display = '-';
              }
              return <div className="px-3 h-full flex items-center justify-end bg-pink-50">{display}</div>;
            },
            size: 120,
            filterFn: (row, id, filter) => numberFilter(row, id, filter),
          },
        ],
      },
      // HH 1.1 Group
      {
        id: 'hh_1_1_group',
        header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-yellow-100">HH 1.1</div>,
        columns: [
          {
            accessorKey: 'hh11Ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <SortButton column={column}>Tỉ lệ</SortButton>
                <NumberFilter column={column} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center justify-end">{formatRatio(row.getValue('hh11Ratio'))}</div>,
            size: 90,
            filterFn: (row, id, filter) => numberFilter(row, id, filter),
          },
          {
            accessorKey: 'hh11Patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <SortButton column={column}>Người lấy mẫu</SortButton>
                <DropdownFilter column={column} title="Người lấy mẫu" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-2 h-full flex items-center">{row.getValue('hh11Patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => textFilter(row, id, value),
          },
        ],
      },
      // HH 2.1 Group
      {
        id: 'hh_2_1_group',
        header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-green-100">HH 2.1</div>,
        columns: [
          {
            accessorKey: 'hh21Ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <SortButton column={column}>Tỉ lệ</SortButton>
                <NumberFilter column={column} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center justify-end">{formatRatio(row.getValue('hh21Ratio'))}</div>,
            size: 90,
            filterFn: (row, id, filter) => numberFilter(row, id, filter),
          },
          {
            accessorKey: 'hh21Patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <SortButton column={column}>Người lấy mẫu</SortButton>
                <DropdownFilter column={column} title="Người lấy mẫu" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center">{row.getValue('hh21Patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => textFilter(row, id, value),
          },
        ],
      },
      // HH 2.2 Group
      {
        id: 'hh_2_2_group',
        header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-yellow-100">HH 2.2</div>,
        columns: [
          {
            accessorKey: 'hh22Ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <SortButton column={column}>Tỉ lệ</SortButton>
                <NumberFilter column={column} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center justify-end">{formatRatio(row.getValue('hh22Ratio'))}</div>,
            size: 90,
            filterFn: (row, id, filter) => numberFilter(row, id, filter),
          },
          {
            accessorKey: 'hh22Patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <SortButton column={column}>Người lấy mẫu</SortButton>
                <DropdownFilter column={column} title="Người lấy mẫu" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center">{row.getValue('hh22Patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => textFilter(row, id, value),
          },
        ],
      },
      // HH 2.3 Group
      {
        id: 'hh_2_3_group',
        header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-green-100">HH 2.3</div>,
        columns: [
          {
            accessorKey: 'hh23Ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <SortButton column={column}>Tỉ lệ</SortButton>
                <NumberFilter column={column} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center justify-end">{formatRatio(row.getValue('hh23Ratio'))}</div>,
            size: 90,
            filterFn: (row, id, filter) => numberFilter(row, id, filter),
          },
          {
            accessorKey: 'hh23Patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-green-100">
                <SortButton column={column}>Người lấy mẫu</SortButton>
                <DropdownFilter column={column} title="Người lấy mẫu" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-green-50 px-3 h-full flex items-center">{row.getValue('hh23Patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => textFilter(row, id, value),
          },
        ],
      },
      // HH 3.1 Group
      {
        id: 'hh_3_1_group',
        header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-yellow-100">HH 3.1</div>,
        columns: [
          {
            accessorKey: 'hh31Ratio',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <SortButton column={column}>Tỉ lệ</SortButton>
                <NumberFilter column={column} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center justify-end">{formatRatio(row.getValue('hh31Ratio'))}</div>,
            size: 90,
            filterFn: (row, id, filter) => numberFilter(row, id, filter),
          },
          {
            accessorKey: 'hh31Patient',
            header: ({ column }) => (
              <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
                <SortButton column={column}>Người lấy mẫu</SortButton>
                <DropdownFilter column={column} title="Người lấy mẫu" data={data} />
              </div>
            ),
            cell: ({ row }) => <div className="bg-yellow-50 px-3 h-full flex items-center">{row.getValue('hh31Patient') || ''}</div>,
            size: 110,
            filterFn: (row, id, value: string[]) => textFilter(row, id, value),
          },
        ],
      },
      // TL lỗ và các cột còn lại
      {
        accessorKey: 'lossRatio',
        header: ({ column }) => (
          <div className="px-2 py-1 bg-pink-100">
            <SortButton column={column}>Tỉ lệ</SortButton>
            <NumberFilter column={column} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center justify-end bg-pink-50">{formatRatio(row.getValue('lossRatio')) || '-'}</div>,
        size: 100,
        filterFn: (row, id, filter) => numberFilter(row, id, filter),
      },
      {
        accessorKey: 'destinationName',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Nơi xuất</SortButton>
            <DropdownFilter column={column} title="Nơi xuất" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('destinationName') || '-'}</div>,
        size: 110,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'insuranceTypeName',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Loại hình</SortButton>
            <DropdownFilter column={column} title="Loại hình" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('insuranceTypeName') || '-'}</div>,
        size: 110,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'applyDate',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Ngày áp dụng</SortButton>
            <DropdownFilter column={column} title="Ngày áp dụng" data={data} />
          </div>
        ),
        cell: ({ row }) => <div className="px-3 h-full flex items-center">{row.getValue('applyDate') || '-'}</div>,
        size: 130,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'active',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Trạng thái</SortButton>
            <DropdownFilter column={column} title="Trạng thái" data={data} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            <span
              className={`inline-flex items-center rounded-full px-3 py-2 text-xs font-medium ${
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
        header: () => <div className="px-2 py-1 text-xs font-medium">Thao tác</div>,
        cell: ({ row }) => (
          <div className="flex gap-2 px-3 h-full items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditFood(row.original)}
              title="Chỉnh sửa"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeactivateFood(row.original)}
              title={row.original.active ? 'Ngừng hoạt động' : 'Kích hoạt lại'}
            >
                {row.original.active ? (
                  // Show the same Power icon for 'Ngừng hoạt động' but in red
                  <Power className="h-4 w-4 text-red-600" />
                ) : (
                  // Show Power icon in green for 'Kích hoạt lại'
                  <Power className="h-4 w-4 text-green-600" />
                )}
            </Button>
          </div>
        ),
        size: 120,
      },
    ],
    [data, handleDeactivateFood]
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
          <Button size="sm" variant="outline" onClick={handleImportExcel} disabled={loading}>
            <Upload className="w-4 h-4" />
            {loading ? 'Đang import...' : 'Import Excel'}
          </Button>
          {/* Temporarily hidden */}
          {/* <Button size="sm" onClick={handleAddFood}>
            <Plus className="w-4 h-4" />
            Thêm mới
          </Button> */}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto" style={{ overflow: 'visible' }}>
        <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
          <table className="w-full" style={{ tableLayout: 'auto' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/30 h-6">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="text-center text-sm font-medium whitespace-nowrap h-6"
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
        onSave={handleSaveFood}
      />

      {/* Import Errors Modal */}
      {showImportErrors && importErrors.length > 0 && (
        <ImportErrorsModal
          errors={importErrors}
          open={showImportErrors}
          onClose={() => setShowImportErrors(false)}
        />
      )}
    </div>
  );
}

// Component hiển thị bảng errors khi import
interface ImportErrorsModalProps {
  errors: ImportError[];
  open: boolean;
  onClose: () => void;
}

function ImportErrorsModal({ errors, open, onClose }: ImportErrorsModalProps) {
  // Export errors to Excel
  const handleExportErrors = useCallback(async () => {
    try {
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Lưu danh sách lỗi import',
        defaultPath: `import-errors-${new Date().toISOString().split('T')[0]}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Prepare data for export
        const exportData = errors.map(error => ({
          'Dòng': error.row,
          'Lỗi': error.error,
          'Mã số': error.foodId || '',
          'Nơi lấy mẫu': error.originName || '',
          'Thực phẩm': error.foodName || '', 
          'Đơn vị': error.unit || '',
          'Calorie/đơn vị': error.caloriePerUnit || ''
        }));

        // Use a simple method to write Excel (we'll need to add this to backend)
        await window.electronAPI.food.exportImportErrors(result.filePath, exportData);
        alert('Export thành công!');
      }
    } catch (error) {
      console.error('Error exporting errors:', error);
      alert('Lỗi khi export danh sách lỗi');
    }
  }, [errors]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mt-1">
              Các dòng dữ liệu không thể import được. Vui lòng sửa lỗi và thử lại.
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleExportErrors} className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export Excel
            </Button>
            <Button size="sm" variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
              Đóng
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          <div className="rounded-md border overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="text-left text-xs p-3 font-medium">Dòng</th>
                  <th className="text-left text-xs p-3 font-medium">Lỗi</th>
                  <th className="text-left text-xs p-3 font-medium">Mã số</th>
                  <th className="text-left text-xs p-3 font-medium">Nơi lấy mẫu</th>
                  <th className="text-left text-xs p-3 font-medium">Thực phẩm</th>
                  <th className="text-left text-xs p-3 font-medium">Đơn vị</th>
                  <th className="text-left text-xs p-3 font-medium">Calorie/đơn vị</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((error, index) => (
                  <tr key={index} className="border-b hover:bg-muted/20">
                    <td className="p-3 font-mono text-xs">{error.row}</td>
                    <td className="p-3 text-xs text-red-600 max-w-xs">
                      <div 
                        className={`${error.error.length > 50 ? 'truncate' : ''}`} 
                        title={error.error.length > 50 ? error.error : undefined}
                      >
                        {error.error}
                      </div>
                    </td>
                    <td className="p-3 text-xs font-mono">{error.foodId || '-'}</td>
                    <td className="p-3 text-xs">{error.originName || '-'}</td>
                    <td className="p-3 text-xs">{error.foodName || '-'}</td>
                    <td className="p-3 text-xs">{error.unit || '-'}</td>
                    <td className="p-3 text-xs text-right">
                      {error.caloriePerUnit ? formatNumber(parseFloat(error.caloriePerUnit)) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

