import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '../ui/card';
import DataTable from '../ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Input } from '../ui/input';
import { DropdownFilter, NumberFilter, SortButton } from '../ui/TableFilters';
import { numberFilter, textFilter } from '../ui/TableHelpers';
import { Button } from '../ui/button';
import { Download } from 'lucide-react';

interface AnalysisPatientRow {
  patient: string;
  totalCalories: number;
  totalLoss: number;
  remainingCalories: number;
}

export default function AnalysisByPatient() {
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
  const [data, setData] = useState<AnalysisPatientRow[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!fromMonthYear || !toMonthYear) return;
      if (!window.electronAPI) return setData([]);
      try {
        const result = await window.electronAPI.analysis.getPatientAnalysis({ fromMonthYear, toMonthYear });
        if (result.success) setData(result.data);
        else setData([]);
      } catch (error) {
        console.error('Error loading patient analysis', error);
      }
    };
    load();
  }, [fromMonthYear, toMonthYear]);

  const handleExportExcel = async () => {
    if (!window.electronAPI || data.length === 0) return;

    try {
      const result = await window.electronAPI.dialog.showSaveDialog({
        title: 'Xuất Excel phân tích người lấy mẫu',
        defaultPath: `Phan_tich_nguoi_lay_mau_${fromMonthYear}_${toMonthYear}.xlsx`,
        filters: [{ name: 'Excel Files', extensions: ['xlsx'] }],
      });

      if (!result.canceled && result.filePath) {
        const exportResult = await window.electronAPI.analysis.exportPatientAnalysisToExcel(data, result.filePath);
        if (exportResult.success) {
          alert('Xuất Excel thành công!');
        } else {
          alert(`Lỗi xuất Excel: ${exportResult.error}`);
        }
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Lỗi xuất Excel!');
    }
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalCalories = data.reduce((sum, row) => sum + (row.totalCalories || 0), 0);
    const totalLoss = data.reduce((sum, row) => sum + (row.totalLoss || 0), 0);
    const totalRemainingCalories = data.reduce((sum, row) => sum + (row.remainingCalories || 0), 0);
    return { totalCalories, totalLoss, totalRemainingCalories };
  }, [data]);

  const columns = useMemo<ColumnDef<AnalysisPatientRow>[]>(() => [
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
      accessorKey: 'patient',
      header: ({column}) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Người lấy mẫu</SortButton>
            <DropdownFilter column={column} data={data} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs">
          {row.getValue('patient')}
        </div>
      ),
      size: 150,
      filterFn: textFilter,
    },
    {
      accessorKey: 'totalCalories',
      header: ({column}) => (
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
      size: 120,
      filterFn: numberFilter,
    },
    {
      accessorKey: 'totalLoss',
      header: ({column}) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Calo hao hụt</SortButton>
            <NumberFilter column={column} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs justify-end">
          {row.getValue('totalLoss')?.toLocaleString()}
        </div>
      ),
      size: 120,
      filterFn: numberFilter,
    },
    {
      accessorKey: 'remainingCalories',
      header: ({column}) => (
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex">
            <SortButton column={column}>Calo còn lại</SortButton>
            <NumberFilter column={column} />
          </div>
        </div>
      ),
      cell: ({ row }) => (
        <div className="px-3 h-full flex items-center text-xs justify-end">
          {row.getValue('remainingCalories')?.toLocaleString()}
        </div>
      ),
      size: 120,
      filterFn: numberFilter,
    },
  ], [data]);

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

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-medium">Phân tích Người lấy mẫu (HH 3.1)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportExcel}
                disabled={data.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Xuất Excel
              </Button>
            </div>
            <div className="max-w-4xl">
              <DataTable
                data={data}
                columns={columns}
                showTotalRow={true}
                totalRowData={{
                  totalCalories: totals.totalCalories,
                  totalLoss: totals.totalLoss,
                  remainingCalories: totals.totalRemainingCalories,
                } as Partial<AnalysisPatientRow>}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}