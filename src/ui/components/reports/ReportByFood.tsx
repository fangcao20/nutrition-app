import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '../ui/card';
import DataTable from '../ui/data-table';
import { 
  ColumnDef,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import type { FoodSummaryRow, PatientDetailRow } from '../../../../types/report';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, X, Download } from 'lucide-react';
import { SortButton, DropdownFilter, NumberFilter } from '../ui/TableFilters';
import { textFilter, numberFilter } from '../ui/TableHelpers';

// Helper function to format ratio: < 1 as percentage, >= 1 as integer
const formatRatio = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  if (value < 1) {
    return `${(value * 100).toFixed(1)}%`;
  } else {
    return Math.round(value).toLocaleString();
  }
};

export default function ReportByFood() {
  const [fromMonthYear, setFromMonthYear] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [toMonthYear, setToMonthYear] = useState<string>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });
  const [data, setData] = useState<FoodSummaryRow[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [detailData, setDetailData] = useState<PatientDetailRow[]>([]);

  const handleViewDetail = useCallback(async (foodId: string) => {
    if (!fromMonthYear || !toMonthYear) return;
    setSelectedFoodId(foodId);
    try {
      const result = await window.electronAPI.report.getFoodDetail({ fromMonthYear, toMonthYear, foodId });
      if (result.success) setDetailData(result.data);
      else setDetailData([]);
    } catch (error) {
      console.error('Error loading food detail', error);
      setDetailData([]);
    }
  }, [fromMonthYear, toMonthYear]);

  const handleFilterChange = useCallback(() => {
    // Clear detail when filtering changes
    setSelectedFoodId(null);
    setDetailData([]);
  }, []);

  const handleExportSummaryExcel = useCallback(async () => {
    if (!data.length) {
      alert('Không có dữ liệu để xuất');
      return;
    }

    try {
      // Show save dialog
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Xuất báo cáo thực phẩm tổng quan',
        defaultPath: `Bao_cao_thuc_pham_tong_quan_${fromMonthYear}_den_${toMonthYear}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Call the export API
        const exportResult = await window.electronAPI.report.exportFoodSummaryToExcel(data, result.filePath);
        
        if (exportResult.success) {
          alert('Xuất Excel thành công!');
        } else {
          alert(`Lỗi xuất Excel: ${exportResult.error || 'Không xác định'}`);
        }
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert(`Lỗi khi xuất Excel: ${error instanceof Error ? error.message : 'Không xác định'}`);
    }
  }, [data, fromMonthYear, toMonthYear]);

  const handleExportDetailExcel = useCallback(async () => {
    if (!detailData.length) {
      alert('Không có dữ liệu chi tiết để xuất');
      return;
    }

    try {
      // Show save dialog
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Xuất báo cáo thực phẩm chi tiết',
        defaultPath: `Bao_cao_thuc_pham_chi_tiet_${selectedFoodId}_${fromMonthYear}_den_${toMonthYear}.xlsx`,
        filters: [
          { name: 'Excel Files', extensions: ['xlsx'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });

      if (!result.canceled && result.filePath) {
        // Call the export API
        const exportResult = await window.electronAPI.report.exportFoodDetailToExcel(detailData, result.filePath);
        
        if (exportResult.success) {
          alert('Xuất Excel thành công!');
        } else {
          alert(`Lỗi xuất Excel: ${exportResult.error || 'Không xác định'}`);
        }
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert(`Lỗi khi xuất Excel: ${error instanceof Error ? error.message : 'Không xác định'}`);
    }
  }, [detailData, selectedFoodId, fromMonthYear, toMonthYear]);

  useEffect(() => {
    const load = async () => {
      if (!fromMonthYear || !toMonthYear) return;
      if (!window.electronAPI) return setData([]);
      try {
        const result = await window.electronAPI.report.getFoodSummary({ fromMonthYear, toMonthYear });
        if (result.success) setData(result.data);
        else setData([]);
      } catch (error) {
        console.error('Error loading food summary', error);
      }
    };
    load();
    // Clear detail when months change
    setSelectedFoodId(null);
    setDetailData([]);
  }, [fromMonthYear, toMonthYear]);

  // Calculate totals for summary table
  const summaryTotals = useMemo(() => {
    const totalQuantity = data.reduce((sum, row) => sum + (row.totalQuantity || 0), 0);
    const totalCalories = data.reduce((sum, row) => sum + (row.totalCalories || 0), 0);
    return { totalQuantity, totalCalories };
  }, [data]);

  const summaryColumns = useMemo<ColumnDef<FoodSummaryRow>[]>(() => [
    {
      id: 'stt',
      header: ({column}) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>STT</SortButton>
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-center text-xs">
          {row.index + 1}
        </div>
      ),
      size: 50,
    },
    {
      accessorKey: 'foodId',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Mã thực phẩm</SortButton>
            <DropdownFilter column={column} data={data} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs">
          {row.getValue('foodId')}
        </div>
      ),
      size: 120,
      filterFn: textFilter,
    },
    {
      accessorKey: 'foodName',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Tên thực phẩm</SortButton>
            <DropdownFilter column={column} data={data} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs">
          {row.getValue('foodName')}
        </div>
      ),
      size: 150,
      filterFn: textFilter,
    },
    {
      accessorKey: 'totalQuantity',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Tổng số lượng</SortButton>
            <NumberFilter column={column} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs justify-end">
          {row.getValue('totalQuantity')?.toLocaleString()}
        </div>
      ),
      size: 100,
      filterFn: numberFilter,
    },
    {
      accessorKey: 'totalCalories',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Tổng calo</SortButton>
            <NumberFilter column={column} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs justify-end">
          {row.getValue('totalCalories')?.toLocaleString()}
        </div>
      ),
      size: 100,
      filterFn: numberFilter,
    },
    {
      accessorKey: 'hhGroup',
      header: ({ column }) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Nhóm hao hụt</SortButton>
            <DropdownFilter column={column} data={data} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs">
          {row.getValue('hhGroup')}
        </div>
      ),
      size: 120,
      filterFn: textFilter,
    },
    {
      id: 'actions',
      header: () => <div className="px-3 py-2 text-xs font-medium">Chi tiết</div>,
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center justify-center text-xs">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetail(row.original.foodId)}
            className="h-6 w-6 p-0"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      ),
      size: 80,
      enableSorting: false,
    },
  ], [data, handleViewDetail]);

  // Detailed columns (similar to history) - with full features
  const detailColumns = useMemo<ColumnDef<PatientDetailRow>[]>(() => {
    const baseColumns: ColumnDef<PatientDetailRow>[] = [
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
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Mã số</SortButton>
            <DropdownFilter column={column} data={detailData} />
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
            <DropdownFilter column={column} data={detailData} />
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
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Thực phẩm</SortButton>
            <DropdownFilter column={column} data={detailData} />
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
            <DropdownFilter column={column} data={detailData} />
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
            <DropdownFilter column={column} data={detailData} />
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
    ];

    // Add HH specific columns with grouped structure
    if (detailData.length > 0) {
      // Check if any record has HH data
      const hasHH11 = detailData.some(row => row.hh11Ratio !== undefined);
      const hasHH21 = detailData.some(row => row.hh21Ratio !== undefined);
      const hasHH22 = detailData.some(row => row.hh22Ratio !== undefined);
      const hasHH23 = detailData.some(row => row.hh23Ratio !== undefined);
      const hasHH31 = detailData.some(row => row.hh31Ratio !== undefined);

      if (hasHH11) {
        baseColumns.push(
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
                    {row.getValue('hh11Calories') ? (row.getValue('hh11Calories') as number).toLocaleString() : ''}
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
                    <DropdownFilter column={column} data={detailData} />
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
          }
        );
      }

      if (hasHH21) {
        baseColumns.push(
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
                    <DropdownFilter column={column} data={detailData} />
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
          }
        );
      }

      if (hasHH22) {
        baseColumns.push(
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
                    <DropdownFilter column={column} data={detailData} />
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
          }
        );
      }

      if (hasHH23) {
        baseColumns.push(
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
                    <DropdownFilter column={column} data={detailData} />
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
          }
        );
      }

      if (hasHH31) {
        baseColumns.push(
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
                    <DropdownFilter column={column} data={detailData} />
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
          }
        );
      }
    }

    baseColumns.push(
      {
        accessorKey: 'destinationName',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Nơi xuất</SortButton>
            <DropdownFilter column={column} data={detailData} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            {row.getValue('destinationName') || '-'}
          </div>
        ),
        size: 120,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
      {
        accessorKey: 'insuranceTypeName',
        header: ({ column }) => (
          <div className="flex items-center justify-between px-2 py-1">
            <SortButton column={column}>Loại hình</SortButton>
            <DropdownFilter column={column} data={detailData} />
          </div>
        ),
        cell: ({ row }) => (
          <div className="px-3 h-full flex items-center">
            {row.getValue('insuranceTypeName') || '-'}
          </div>
        ),
        size: 120,
        filterFn: (row, id, value: string[]) => textFilter(row, id, value),
      },
    );

    return baseColumns;
  }, [detailData]);

// Reusable DataTable component for detail view
interface DetailDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

function DetailDataTable<T>({ 
  data, 
  columns 
}: DetailDataTableProps<T>) {
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
                  className="border-b transition-colors h-8"
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
                  Không có dữ liệu chi tiết.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
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

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex items-center gap-4 mb-4 mt-2">
            <label className="text-sm font-medium">Từ tháng:</label>
            <Input type="month" value={fromMonthYear} onChange={(e) => setFromMonthYear(e.target.value)} className="w-48" />
            <label className="text-sm font-medium">-</label>
            <label className="text-sm font-medium">Đến tháng:</label>
            <Input type="month" value={toMonthYear} onChange={(e) => setToMonthYear(e.target.value)} className="w-48" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Tổng quan</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportSummaryExcel}
                disabled={!data.length}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </Button>
            </div>
            <div className="max-w-6xl">
              <DataTable 
                data={data} 
                columns={summaryColumns}
                showTotalRow={true}
                totalRowData={{
                  totalQuantity: summaryTotals.totalQuantity,
                  totalCalories: summaryTotals.totalCalories,
                } as Partial<FoodSummaryRow>}
                rowClassName={(row) => 
                  selectedFoodId === row.original.foodId 
                    ? 'bg-blue-50 border-blue-200' 
                    : ''
                }
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Chi tiết</h3>
              {selectedFoodId && detailData.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportDetailExcel}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Xuất Excel
                </Button>
              )}
            </div>
            {selectedFoodId ? (
              <div>
                <div className="space-y-4">
                  <DetailDataTable data={detailData} columns={detailColumns} />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Chọn "Chi tiết" trên bảng tổng quan để xem chi tiết.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
