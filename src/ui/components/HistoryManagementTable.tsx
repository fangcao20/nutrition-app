import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { X, Download } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { SortButton, DropdownFilter, NumberFilter } from './ui/TableFilters';
import { textFilter, numberFilter } from './ui/TableHelpers';

// Import types from global definitions
import { UsageCalculationRow } from "../../../types/usage";

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
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

function DataTable<T>({ 
  data, 
  columns 
}: DataTableProps<T>) {
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
                  Không có dữ liệu lịch sử cho tháng này.
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

export default function HistoryManagementTable() {
  const [historyData, setHistoryData] = useState<UsageCalculationRow[]>([]);
  const [, setLoading] = useState(false);
  const [selectedMonthYear, setSelectedMonthYear] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const columns: ColumnDef<UsageCalculationRow>[] = useMemo(() => [
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
      header: ({ column }) => (
        <div className="flex items-center justify-between">
          <SortButton column={column}>Mã số</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center font-medium">
          {row.getValue('foodId')}
        </div>
      ),
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
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('originName')}
        </div>
      ),
      size: 130,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'foodName',
      header: ({ column }) => (
        <div className="flex items-center justify-between">
          <SortButton column={column}>Thực phẩm</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('foodName')}
        </div>
      ),
      size: 120,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'unit',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Đơn vị tính</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('unit')}
        </div>
      ),
      size: 100,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'value',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Giá trị</SortButton>
          <NumberFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end">
          {(row.getValue('value') as number).toLocaleString()}
        </div>
      ),
      size: 100,
      filterFn: (row, id, filter) => numberFilter(row, id, filter),
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Số lượng</SortButton>
          <NumberFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end">
          {(row.getValue('quantity') as number).toLocaleString()}
        </div>
      ),
      size: 100,
      filterFn: (row, id, filter) => numberFilter(row, id, filter),
    },
    {
      accessorKey: 'monthYear',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Ngày tháng</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('monthYear') || '-'}
        </div>
      ),
      size: 100,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'totalCalories',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1 bg-blue-100">
          <SortButton column={column}>Tổng Calo</SortButton>
          <NumberFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-blue-50 font-medium">
          {(row.getValue('totalCalories') as number).toLocaleString()}
        </div>
      ),
      size: 100,
      filterFn: (row, id, filter) => numberFilter(row, id, filter),
    },
    {
      id: 'used_calories_group',
      header: () => <div className="px-2 py-1 text-xs font-semibold text-center bg-pink-100">Calo sử dụng</div>,
      columns: [
        {
          accessorKey: 'usedCalories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-pink-100">
              <SortButton column={column}>Tỉ lệ</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-pink-50">
              {formatCalorieUsage(row.getValue('usedCalories') as string | number)}
            </div>
          ),
          size: 120,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'totalUsedCalories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-pink-100">
              <SortButton column={column}>Tổng Calo sử dụng</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => {
            return (
              <div className="px-3 h-full flex items-center justify-end bg-pink-50">
                {(row.getValue('totalUsedCalories') as number).toLocaleString()}
              </div>
            );
          },
          size: 120,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
      ],
    },
    // HH columns group
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
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {formatRatio(row.getValue('hh11Ratio') as number)}
            </div>
          ),
          size: 90,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh11Calories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
              <SortButton column={column}>Calo</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {row.getValue('hh11Calories') !== null && row.getValue('hh11Calories') !== undefined ? (row.getValue('hh11Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh11Patient',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
              <SortButton column={column}>Người lấy mẫu</SortButton>
              <DropdownFilter column={column} data={historyData} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-yellow-50">
              {row.getValue('hh11Patient') || ''}
            </div>
          ),
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
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {formatRatio(row.getValue('hh21Ratio') as number)}
            </div>
          ),
          size: 90,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh21Calories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-green-100">
              <SortButton column={column}>Calo</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {row.getValue('hh21Calories') ? (row.getValue('hh21Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh21Patient',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-green-100">
              <SortButton column={column}>Người lấy mẫu</SortButton>
              <DropdownFilter column={column} data={historyData} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-green-50">
              {row.getValue('hh21Patient') || ''}
            </div>
          ),
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
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {formatRatio(row.getValue('hh22Ratio') as number)}
            </div>
          ),
          size: 90,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh22Calories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
              <SortButton column={column}>Calo</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {row.getValue('hh22Calories') ? (row.getValue('hh22Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh22Patient',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
              <SortButton column={column}>Người lấy mẫu</SortButton>
              <DropdownFilter column={column} data={historyData} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-yellow-50">
              {row.getValue('hh22Patient') || ''}
            </div>
          ),
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
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {formatRatio(row.getValue('hh23Ratio') as number)}
            </div>
          ),
          size: 90,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh23Calories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-green-100">
              <SortButton column={column}>Calo</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-green-50">
              {row.getValue('hh23Calories') ? (row.getValue('hh23Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh23Patient',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-green-100">
              <SortButton column={column}>Người lấy mẫu</SortButton>
              <DropdownFilter column={column} data={historyData} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-green-50">
              {row.getValue('hh23Patient') || ''}
            </div>
          ),
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
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {formatRatio(row.getValue('hh31Ratio') as number)}
            </div>
          ),
          size: 90,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh31Calories',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
              <SortButton column={column}>Calo</SortButton>
              <NumberFilter column={column} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center justify-end bg-yellow-50">
              {row.getValue('hh31Calories') ? (row.getValue('hh31Calories') as number).toLocaleString() : ''}
            </div>
          ),
          size: 80,
          filterFn: (row, id, filter) => numberFilter(row, id, filter),
        },
        {
          accessorKey: 'hh31Patient',
          header: ({ column }) => (
            <div className="flex items-center justify-between px-2 py-1 bg-yellow-100">
              <SortButton column={column}>Người lấy mẫu</SortButton>
              <DropdownFilter column={column} data={historyData} />
            </div>
          ),
          cell: ({ row }) => (
            <div className="px-3 h-full flex items-center bg-yellow-50">
              {row.getValue('hh31Patient') || ''}
            </div>
          ),
          size: 110,
          filterFn: (row, id, value: string[]) => textFilter(row, id, value),
        },
      ],
    },
    {
      accessorKey: 'lossRatio',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1 bg-pink-100">
          <SortButton column={column}>Tỉ lệ</SortButton>
          <NumberFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-pink-50">
          {formatRatio(row.getValue('lossRatio') as number)}
        </div>
      ),
      size: 100,
      filterFn: (row, id, filter) => numberFilter(row, id, filter),
    },
    {
      accessorKey: 'remainingCalories',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1 bg-red-100">
          <SortButton column={column}>Calo còn lại</SortButton>
          <NumberFilter column={column} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-end bg-red-50 font-medium">
          {(row.getValue('remainingCalories') as number).toLocaleString()}
        </div>
      ),
      size: 100,
      filterFn: (row, id, filter) => numberFilter(row, id, filter),
    },
    {
      accessorKey: 'destinationName',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Nơi xuất</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('destinationName') || '-'}
        </div>
      ),
      size: 110,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'insuranceTypeName',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Loại hình</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('insuranceTypeName') || '-'}
        </div>
      ),
      size: 110,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'applyDate',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Ngày áp dụng</SortButton>
          <DropdownFilter column={column} data={historyData} />
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center">
          {row.getValue('applyDate') || '-'}
        </div>
      ),
      size: 130,
      filterFn: (row, id, value: string[]) => textFilter(row, id, value),
    },
    {
      accessorKey: 'active',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-2 py-1">
          <SortButton column={column}>Trạng thái</SortButton>
          <DropdownFilter column={column} data={historyData} />
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
        const cellValue = row.getValue(id);
        const displayValue = cellValue ? 'Hoạt động' : 'Ngừng';
        if (value.includes('(Trống)') && !cellValue) return true;
        if (value.includes(displayValue)) return true;
        return false;
      },
    },
  ], [historyData]);

  const loadHistoryData = useCallback(async () => {
    if (!selectedMonthYear) return;
    
    setLoading(true);
    try {
      const result = await window.electronAPI.usage.getUsageHistory(selectedMonthYear);
      if (result.success) {
        setHistoryData(result.data);
      } else {
        console.error("Lỗi load lịch sử:", result.error);
        setHistoryData([]);
      }
    } catch (error) {
      console.error("Lỗi load lịch sử:", error);
      setHistoryData([]);
    } finally {
      setLoading(false);
    }
  }, [selectedMonthYear]);

  useEffect(() => {
    loadHistoryData();
  }, [selectedMonthYear, loadHistoryData]);

  const handleExportExcel = useCallback(async () => {
    if (!historyData.length) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    try {
      setLoading(true);
      
      // Show save dialog
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Xuất lịch sử sử dụng',
        defaultPath: `Lich_su_su_dung_${selectedMonthYear.replace('-', '_')}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Call the export API
        const exportResult = await window.electronAPI.usage.exportToExcel(historyData, result.filePath);
        
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
  }, [historyData, selectedMonthYear]);

  return (
    <div className="space-y-4">
      {/* Month Year Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Thời gian:</label>
        <Input
          type="month"
          value={selectedMonthYear}
          onChange={(e) => setSelectedMonthYear(e.target.value)}
          className="w-48"
        />
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold"></h3>
            <p className="text-sm text-muted-foreground">
              Thời gian đã chọn: <strong>{selectedMonthYear}</strong> | 
              Tổng số dòng: <strong>{historyData.length}</strong>
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <Button size="sm" onClick={handleExportExcel} disabled={!historyData.length}>
          <Download className="w-4 h-4 mr-2" />
          Xuất Excel
        </Button>
      </div>

      {/* Results Table */}
      <div className="space-y-4">
        
        <DataTable data={historyData} columns={columns} />
      </div>
    </div>
  );
}