import { useState, useEffect } from 'react';
import { Button } from './button';
import { Input } from './input';
import { X } from 'lucide-react';
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
  type Row,
} from '@tanstack/react-table';

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  rowClassName?: (row: Row<T>) => string;
  onFilterChange?: () => void;
  showTotalRow?: boolean;
  totalRowData?: Partial<T>;
}

export default function DataTable<T>({ data, columns, loading, rowClassName, onFilterChange, showTotalRow, totalRowData }: DataTableProps<T>) {
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
      pagination: { pageSize: 15 },
    },
  });

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange();
    }
  }, [columnFilters, globalFilter, onFilterChange]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Tìm kiếm...`}
          value={globalFilter ?? ''}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm text-xs"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setGlobalFilter('');
            setColumnFilters([]);
          }}
          className="text-xs"
        >
          <X className="w-3 h-3 mr-1" />
          Xóa bộ lọc
        </Button>
      </div>


      {/* Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b bg-muted/30 h-8">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left text-xs font-medium h-8"
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
                  className={`border-b transition-colors h-8 ${rowClassName ? rowClassName(row) : ''}`}
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
                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                >
                  {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}
                </td>
              </tr>
            )}
            {/* Total Row */}
            {showTotalRow && totalRowData && (
              <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
                {columns.map((column, index) => {
                  const accessorKey = (column as any).accessorKey;
                  const value = totalRowData[accessorKey as keyof T];
                  
                  return (
                    <td 
                      key={`total-${index}`}
                      className="text-xs h-8 p-0"
                      style={{ 
                        width: column.size || 100,
                        minWidth: column.size || 100
                      }}
                    >
                      <div className="px-3 h-full flex items-center justify-end">
                        {index === 0 ? 'Tổng:' : 
                         value !== undefined ? 
                         (typeof value === 'number' ? value.toLocaleString() : String(value)) : 
                         ''}
                      </div>
                    </td>
                  );
                })}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Hiển thị <strong>{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</strong> đến{' '}
          <strong>{Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}</strong>{' '}
          trong tổng số <strong>{table.getFilteredRowModel().rows.length}</strong> dòng.
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs"
          >
            Trước
          </Button>
          <Button
            variant="outline" 
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs"
          >
            Sau
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { DataTableProps };
