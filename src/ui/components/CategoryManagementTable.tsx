import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
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
import { ArrowUpDown, X } from 'lucide-react';
import type { AllCategories, Category } from '../../../types/category';

interface CategoryTableProps {
  data: Category[];
  title: string;
  loading: boolean;
}

function CategoryTable({ data, title, loading }: CategoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const columns = useMemo<ColumnDef<Category>[]>(() => [
    {
      id: 'stt',
      header: () => <div className="px-3 py-2 text-xs font-medium">STT</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs">
          {row.index + 1}
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="px-2 py-1 text-xs font-medium h-auto"
          >
            Tên
            <ArrowUpDown className="ml-2 h-3 w-3" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs font-medium">
          {row.getValue('name')}
        </div>
      ),
      size: 200,
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
      {/* Search */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Tìm kiếm trong ${title.toLowerCase()}...`}
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
                  className="px-4 py-8 text-center text-xs text-muted-foreground"
                >
                  {loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}
                </td>
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

export default function CategoryManagementTable() {
  const [categories, setCategories] = useState<AllCategories>({
    origins: [],
    foodNames: [],
    units: [],
    destinations: [],
    insuranceTypes: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('origins');
  
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      if (!window.electronAPI) {
        console.error('ElectronAPI not available');
        return;
      }

      const allCategories = await window.electronAPI.category.getAll();
      setCategories(allCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      alert('Lỗi khi tải dữ liệu danh mục');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="origins" className="text-xs">Nơi lấy mẫu</TabsTrigger>
        <TabsTrigger value="foodNames" className="text-xs">Tên thực phẩm</TabsTrigger>
        <TabsTrigger value="destinations" className="text-xs">Nơi xuất</TabsTrigger>
        <TabsTrigger value="insuranceTypes" className="text-xs">Loại hình bảo hiểm</TabsTrigger>
      </TabsList>

      <TabsContent value="origins">
        <CategoryTable 
          data={categories.origins} 
          title="Nơi lấy mẫu" 
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="foodNames">
        <CategoryTable 
          data={categories.foodNames} 
          title="Tên thực phẩm" 
          loading={loading}
        />
      </TabsContent>

      {/* `units` tab removed as requested */}

      <TabsContent value="destinations">
        <CategoryTable 
          data={categories.destinations} 
          title="Nơi xuất" 
          loading={loading}
        />
      </TabsContent>

      <TabsContent value="insuranceTypes">
        <CategoryTable 
          data={categories.insuranceTypes} 
          title="Loại hình bảo hiểm" 
          loading={loading}
        />
      </TabsContent>
    </Tabs>
  );
}