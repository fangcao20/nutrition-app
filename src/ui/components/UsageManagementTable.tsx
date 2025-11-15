import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
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
} from '@tanstack/react-table';
import { Upload, Calculator, Download, X, ArrowUpDown, Save, Trash2 } from 'lucide-react';
import type { 
  UsageInputData, 
  UsageCalculationRow, 
  UsageCalculationResult,
  UsageCalculationRequest,
  SaveUsageRequest 
} from '../../../types/usage';

// Helper function to format ratio: < 1 as percentage, >= 1 as integer
const formatRatio = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  if (value < 1) {
    return `${(value * 100).toFixed(1)}%`;
  } else {
    return Math.round(value).toLocaleString();
  }
};

// Helper function to format calorie usage (could be string percentage or number)
const formatCalorieUsage = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  
  // If it's already a string percentage, return as is
  if (typeof value === 'string') {
    if (value.includes('%')) return value;
    // If it's a string number, parse and format
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value; // Return original if not a valid number
    return formatRatio(numValue);
  }
  
  // If it's a number, use the same formatting logic as ratio
  return formatRatio(value);
};

// Reusable DataTable component
function DataTable<T>({ 
  data, 
  columns 
}: { 
  data: T[], 
  columns: ColumnDef<T>[] 
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

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
        pageSize: 15,
      },
    },
  });

  return (
    <div className="space-y-4">
      {/* Search */}
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
              table.getRowModel().rows.map((row) => {
                const hasError = (row.original as any)?.hasError;
                return (
                  <tr
                    key={row.id}
                    className={`border-b transition-colors h-8 ${
                      hasError
                        ? "bg-red-50 hover:bg-red-100"
                        : "hover:bg-muted/20"
                    }`}
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
                );
              })
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
    </div>
  );
}

export default function UsageManagementTable() {
  const [selectedMonthYear, setSelectedMonthYear] = useState('');
  const [inputData, setInputData] = useState<UsageInputData[]>([]);
  const [calculatedData, setCalculatedData] = useState<UsageCalculationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'select' | 'review' | 'result'>('select');
  const [calculationResult, setCalculationResult] = useState<UsageCalculationResult | null>(null);

  // Calculate error count
  const errorCount = useMemo(() => {
    return inputData.filter((item: any) => item.hasError).length;
  }, [inputData]);

  // Get current month/year as default
  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    setSelectedMonthYear(`${year}-${month}`);
  }, []);

  // Function to remove a row from input data
  const removeRow = useCallback((index: number) => {
    setInputData(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Input data table for review
  const inputColumns = useMemo<ColumnDef<UsageInputData>[]>(() => {
    const baseColumns: ColumnDef<UsageInputData>[] = [
      {
        id: 'stt',
        header: () => <div className="px-3 py-2 text-xs font-medium">STT</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center text-xs">
            {row.index + 1}
          </div>
        ),
        size: 50,
      },
      {
        accessorKey: 'foodId',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex-1"
          >
            Mã số
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center font-medium">
            {row.getValue('foodId')}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'originName',
        header: () => <div className="px-3 py-2 text-xs font-medium">Nơi lấy mẫu</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            {row.getValue('originName')}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'foodName',
        header: () => <div className="px-3 py-2 text-xs font-medium">Thực phẩm</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            {row.getValue('foodName')}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'unit',
        header: () => <div className="px-3 py-2 text-xs font-medium">Đơn vị tính</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            {row.getValue('unit')}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'value',
        header: () => <div className="px-3 py-2 text-xs font-medium">Giá trị</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center justify-end">
            {(row.getValue('value') as number).toLocaleString()}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'monthYear',
        header: () => <div className="px-3 py-2 text-xs font-medium bg-orange-100">Ngày tháng</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center bg-orange-100">
            {row.getValue('monthYear') || '-'}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'quantity',
        header: () => <div className="px-3 py-2 text-xs font-medium bg-orange-100">Số lượng</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center justify-end bg-orange-100">
            {(row.getValue('quantity') as number).toLocaleString()}
          </div>
        ),
        size: 80,
      },
      {
        accessorKey: 'totalCalories',
        header: () => <div className="px-3 py-2 text-xs font-medium bg-orange-100">Tổng Calo</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center justify-end bg-orange-100">
            {(row.getValue('totalCalories') as number)?.toLocaleString() || '-'}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'hh31Patient',
        header: () => <div className="px-3 py-2 text-xs font-medium bg-blue-100">HH 3.1/Người lấy mẫu</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center bg-blue-100">
            {row.getValue('hh31Patient') || '-'}
          </div>
        ),
        size: 100,
      },
      {
        accessorKey: 'destinationName',
        header: () => <div className="px-3 py-2 text-xs font-medium">Nơi xuất</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            {row.getValue('destinationName') || '-'}
          </div>
        ),
        size: 100,
      },
    ];

    // Conditionally add Error column if there are errors
    if (errorCount > 0) {
      baseColumns.push({
        accessorKey: 'errorMessage',
        header: () => <div className="px-3 py-2 text-xs font-medium text-red-600">Lỗi</div>,
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center text-red-600 text-xs">
            {row.getValue('errorMessage') || ''}
          </div>
        ),
        size: 200,
      });

      // Add Action column to remove error rows
      baseColumns.push({
        id: 'actions',
        header: () => <div className="px-3 py-2 text-xs font-medium text-red-600">Xóa</div>,
        cell: ({ row }) => {
          const hasError = (row.original as any)?.hasError;
          return hasError ? (
            <div className="px-3 h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRow(row.index)}
                className="p-1 h-6 w-6 text-red-600 hover:text-red-800 hover:bg-red-50"
                title="Xóa dòng lỗi"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div className="px-3 h-full flex items-center justify-center"></div>
          );
        },
        size: 70,
      });
    }

    return baseColumns;
  }, [errorCount, removeRow]);

  // Result data table
  const resultColumns = useMemo<ColumnDef<UsageCalculationRow>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="px-3 py-2 text-xs font-medium">STT</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.index + 1}
        </div>
      ),
      size: 50,
    },
    {
      accessorKey: 'foodId',
      header: () => <div className="px-3 py-2 text-xs font-medium">Mã số</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center font-medium">
          {row.getValue('foodId')}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'originName',
      header: () => <div className="px-3 py-2 text-xs font-medium">Nơi lấy mẫu</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('originName')}
        </div>
      ),
      size: 130,
    },
    {
      accessorKey: 'foodName',
      header: () => <div className="px-3 py-2 text-xs font-medium">Thực phẩm</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('foodName')}
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: 'unit',
      header: () => <div className="px-3 py-2 text-xs font-medium">Đơn vị tính</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('unit')}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'value',
      header: () => <div className="px-3 py-2 text-xs font-medium">Giá trị</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end">
          {(row.getValue('value') as number).toLocaleString()}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'monthYear',
      header: () => <div className="px-3 py-2 text-xs font-medium bg-orange-100">Ngày tháng</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center bg-orange-100">
          {row.getValue('monthYear') || '-'}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'quantity',
      header: () => <div className="px-3 py-2 text-xs font-medium bg-orange-100">Số lượng</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-orange-100">
          {(row.getValue('quantity') as number).toLocaleString()}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'totalCalories',
      header: () => <div className="px-3 py-2 text-xs font-medium bg-orange-100">Tổng Calo</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-orange-100 font-medium">
          {(row.getValue('totalCalories') as number).toLocaleString()}
        </div>
      ),
      size: 100,
    },
    {
      id: 'used_calories_group',
      header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-pink-100">Calo sử dụng</div>,
      columns: [
        {
          accessorKey: 'usedCalories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-pink-100">Tỉ lệ</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-pink-50">
              {formatCalorieUsage(row.getValue('usedCalories') as string | number)}
            </div>
          ),
          size: 120,
        },
        {
          accessorKey: 'totalUsedCalories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-pink-100">Tổng Calo sử dụng</div>,
          cell: ({ row }) => {
            // Calculate totalUsedCalories if not available from data
            // If < 1 (percentage) → multiply with totalCalories, if >= 1 (absolute) → multiply with quantity
            let totalUsedCalories = row.getValue('totalUsedCalories') as number;
            if (!totalUsedCalories) {
              const usedCalories = row.getValue('usedCalories');
              const totalCalories = row.getValue('totalCalories') as number;
              const quantity = row.getValue('quantity') as number;
              if (usedCalories && totalCalories && quantity) {
                const numValue = parseFloat(String(usedCalories));
                if (!isNaN(numValue)) {
                  totalUsedCalories = numValue < 1 ? 
                    Math.round(numValue * totalCalories) : 
                    Math.round(numValue * quantity);
                }
              }
            }
            return (
              <div className="px-3 h-full flex items-center justify-end bg-pink-50">
                {totalUsedCalories ? totalUsedCalories.toLocaleString() : ''}
              </div>
            );
          },
          size: 120,
        },
      ],
    },
    // HH columns group
    {
      id: 'hh_1_1_group',
      header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-yellow-100">HH 1.1</div>,
      columns: [
        {
          accessorKey: 'hh11Ratio',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Tỉ lệ</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {formatRatio(row.getValue('hh11Ratio') as number)}
            </div>
          ),
          size: 90,
        },
        {
          accessorKey: 'hh11Calories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Calo</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {row.getValue('hh11Calories') !== null && row.getValue('hh11Calories') !== undefined ? (row.getValue('hh11Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
        },
        {
          accessorKey: 'hh11Patient',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Người lấy mẫu</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-yellow-50">
              {row.getValue('hh11Patient') || ''}
            </div>
          ),
          size: 110,
        },
      ],
    },
    // HH 2.1 Group
    {
      id: 'hh_2_1_group',
      header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-green-100">HH 2.1</div>,
      columns: [
        {
          accessorKey: 'hh21Ratio',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-green-100">Tỉ lệ</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {formatRatio(row.getValue('hh21Ratio') as number)}
            </div>
          ),
          size: 90,
        },
        {
          accessorKey: 'hh21Calories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-green-100">Calo</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {row.getValue('hh21Calories') ? (row.getValue('hh21Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
        },
        {
          accessorKey: 'hh21Patient',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-green-100">Người lấy mẫu</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-green-50">
              {row.getValue('hh21Patient') || ''}
            </div>
          ),
          size: 110,
        },
      ],
    },
    // HH 2.2 Group
    {
      id: 'hh_2_2_group',
      header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-yellow-100">HH 2.2</div>,
      columns: [
        {
          accessorKey: 'hh22Ratio',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Tỉ lệ</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {formatRatio(row.getValue('hh22Ratio') as number)}
            </div>
          ),
          size: 90,
        },
        {
          accessorKey: 'hh22Calories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Calo</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {row.getValue('hh22Calories') ? (row.getValue('hh22Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
        },
        {
          accessorKey: 'hh22Patient',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Người lấy mẫu</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-yellow-50">
              {row.getValue('hh22Patient') || ''}
            </div>
          ),
          size: 110,
        },
      ],
    },
    // HH 2.3 Group
    {
      id: 'hh_2_3_group',
      header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-green-100">HH 2.3</div>,
      columns: [
        {
          accessorKey: 'hh23Ratio',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-green-100">Tỉ lệ</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {formatRatio(row.getValue('hh23Ratio') as number)}
            </div>
          ),
          size: 90,
        },
        {
          accessorKey: 'hh23Calories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-green-100">Calo</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {row.getValue('hh23Calories') ? (row.getValue('hh23Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
        },
        {
          accessorKey: 'hh23Patient',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-green-100">Người lấy mẫu</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-green-50">
              {row.getValue('hh23Patient') || ''}
            </div>
          ),
          size: 110,
        },
      ],
    },
    // HH 3.1 Group
    {
      id: 'hh_3_1_group',
      header: () => <div className="px-3 py-2 text-xs font-semibold text-center bg-yellow-100">HH 3.1</div>,
      columns: [
        {
          accessorKey: 'hh31Ratio',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Tỉ lệ</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {formatRatio(row.getValue('hh31Ratio') as number)}
            </div>
          ),
          size: 90,
        },
        {
          accessorKey: 'hh31Calories',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Calo</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {row.getValue('hh31Calories') ? (row.getValue('hh31Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
        },
        {
          accessorKey: 'hh31Patient',
          header: () => <div className="px-3 py-2 text-xs font-medium bg-yellow-100">Người lấy mẫu</div>,
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-yellow-50">
              {row.getValue('hh31Patient') || ''}
            </div>
          ),
          size: 110,
        },
      ],
    },
    {
      accessorKey: 'lossRatio',
      header: () => <div className="px-3 py-2 text-xs font-medium bg-pink-100">Tỉ lệ</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-pink-50">
          {formatRatio(row.getValue('lossRatio') as number)}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'remainingCalories',
      header: () => <div className="px-3 py-2 text-xs font-medium bg-red-100">Calo còn lại</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-red-50 font-medium">
          {(row.getValue('remainingCalories') as number).toLocaleString()}
        </div>
      ),
      size: 100,
    },
    {
      accessorKey: 'destinationName',
      header: () => <div className="px-3 py-2 text-xs font-medium">Nơi xuất</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('destinationName') || '-'}
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: 'insuranceTypeName',
      header: () => <div className="px-3 py-2 text-xs font-medium">Loại hình</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('insuranceTypeName') || '-'}
        </div>
      ),
      size: 110,
    },
    {
      accessorKey: 'applyDate',
      header: () => <div className="px-3 py-2 text-xs font-medium">Ngày áp dụng</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('applyDate') || '-'}
        </div>
      ),
      size: 130,
    },
    {
      accessorKey: 'active',
      header: () => <div className="px-3 py-2 text-xs font-medium">Trạng thái</div>,
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
    },
  ], []);

  const handleFileImport = useCallback(async () => {
    if (!selectedMonthYear) {
      alert('Vui lòng chọn thời gian trước');
      return;
    }

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
        
        // Parse Excel file using the backend API
        try {
          const parseResult = await window.electronAPI.usage.parseExcel(filePath);
          setInputData(parseResult);
          setCurrentStep('review');
        } catch (parseError) {
          console.error('Error parsing Excel:', parseError);
          alert('Lỗi khi đọc file Excel: ' + (parseError instanceof Error ? parseError.message : 'Không xác định'));
        }
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Lỗi khi import file Excel');
    } finally {
      setLoading(false);
    }
  }, [selectedMonthYear]);

  const handleCalculate = useCallback(async () => {
    if (!inputData.length) return;

    try {
      setLoading(true);
      const request: UsageCalculationRequest = {
        selectedMonthYear,
        inputData
      };

      // Gọi API để lấy dữ liệu từ database
      console.log('🔄 Calling database API for usage calculation:', request);
      const result = await window.electronAPI.usage.calculateUsage(request);
      console.log('📊 Database API response:', result);
      
      if (result.success && result.calculatedData.length > 0) {
        console.log('✅ Successfully retrieved data from database');
        setCalculatedData(result.calculatedData);
        setCalculationResult(result);
        setCurrentStep('result');
      } else {
        // API trả về nhưng không có data hoặc thất bại
        const errorMsg = result.success 
          ? 'Không tìm thấy dữ liệu tính toán cho các thực phẩm này trong database.'
          : 'Lỗi khi tính toán dữ liệu từ database.';
        
        console.error('❌ Database calculation failed:', errorMsg);
        alert(errorMsg + ' Vui lòng kiểm tra lại dữ liệu hoặc liên hệ admin.');
        
        // Không dùng mock data, để user biết có lỗi
        setCurrentStep('review'); // Quay lại step review để user có thể thử lại
      }
      
    } catch (error) {
      console.error('💥 Error in handleCalculate:', error);
      alert('Lỗi khi tính toán');
    } finally {
      setLoading(false);
    }
  }, [inputData, selectedMonthYear]);

  const handleReset = useCallback(() => {
    setInputData([]);
    setCalculatedData([]);
    setCurrentStep('select');
    setCalculationResult(null);
  }, []);

  const handleExportExcel = useCallback(async () => {
    if (!calculatedData.length) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    try {
      setLoading(true);
      
      // Show save dialog
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Xuất kết quả tính toán',
        defaultPath: `Ket_qua_tinh_toan_${selectedMonthYear.replace('-', '_')}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Call the export API
        const exportResult = await window.electronAPI.usage.exportToExcel(calculatedData, result.filePath);
        
        if (exportResult.success) {
          alert('Xuất Excel thành công!');
        } else {
          alert(`Lỗi xuất Excel: ${exportResult.error || 'Không xác định'}`);
        }
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert(`Lỗi khi xuất Excel: ${error instanceof Error ? error.message : 'Không xác định'}`);
    } finally {
      setLoading(false);
    }
  }, [calculatedData, selectedMonthYear]);

  const handleSaveToDatabase = useCallback(async () => {
    if (!calculatedData.length) {
      alert('Không có dữ liệu để lưu');
      return;
    }

    try {
      setLoading(true);
      
      const saveRequest: SaveUsageRequest = {
        records: calculatedData,
        import_month_year: selectedMonthYear
      };

      const saveResult = await window.electronAPI.usage.saveUsageRecords(saveRequest);
      
      if (saveResult.success) {
        alert(`Lưu thành công ${saveResult.saved_count} bản ghi vào database!`);
      } else {
        alert(`Lỗi khi lưu: ${saveResult.error || 'Không xác định'}`);
      }
    } catch (error) {
      console.error('Error saving to database:', error);
      alert(`Lỗi khi lưu vào database: ${error instanceof Error ? error.message : 'Không xác định'}`);
    } finally {
      setLoading(false);
    }
  }, [calculatedData, selectedMonthYear]);

  return (
    <>
      {/* Step 1: Select Month and Import File */}
      {currentStep === 'select' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Thời gian:</label>
            <Input
              type="month"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="w-48"
            />
            <div className="flex-1" />
            <Button 
              onClick={handleFileImport}
              disabled={loading || !selectedMonthYear}
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {loading ? 'Đang import...' : 'Chọn file Excel'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Review Input Data */}
      {currentStep === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h5 className="text-lg font-semibold">Dữ liệu import</h5>
              <p className="text-sm text-muted-foreground mt-1">
                Thời gian đã chọn: <strong>{selectedMonthYear}</strong> | 
                Tổng số dòng: <strong>{inputData.length}</strong>
                {errorCount > 0 && (
                  <span className="text-red-600 font-medium ml-2">
                    | Lỗi: <strong>{errorCount}</strong> dòng
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                <X className="w-4 h-4 mr-2" />
                Hủy
              </Button>
              <Button 
                onClick={handleCalculate} 
                disabled={loading || errorCount > 0}
                className={errorCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}
              >
                <Calculator className="w-4 h-4 mr-2" />
                {loading ? 'Đang tính...' : 'Tính toán'}
              </Button>
            </div>
          </div>
          <DataTable data={inputData} columns={inputColumns} />
        </div>
      )}

      {/* Step 3: Show Results */}
      {currentStep === 'result' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Kết quả tính toán</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Thời gian: <strong>{selectedMonthYear}</strong> | 
                Đã tính toán: <strong>{calculatedData.length}</strong> dòng
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset}>
                Làm mới
              </Button>
              <Button onClick={handleExportExcel} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                {loading ? 'Đang xuất...' : 'Xuất Excel'}
              </Button>
              <Button onClick={handleSaveToDatabase} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </div>
          <DataTable data={calculatedData} columns={resultColumns} />
        </div>
      )}
    </>
  );
}