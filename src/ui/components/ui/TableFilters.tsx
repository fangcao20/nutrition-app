import { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { Button } from './button';
import { Input } from './input';
import { ArrowUpDown, ChevronDown, Search } from 'lucide-react';
import { Column } from '@tanstack/react-table';
import { formatNumber } from '../../lib/utils';

// Generic Sort Button Component
export function SortButton<T>({
  column,
  children
}: {
  column: Column<T, unknown>;
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

// Enhanced Dropdown Filter Component with blank value support
export function DropdownFilter<T>({
  column,
  data,
}: {
  column: Column<T, unknown>;
  data: T[];
  title?: string;
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
      const value = row[columnId as keyof T];
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
export function NumberFilter<T>({ column }: { column: Column<T, unknown> }) {
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