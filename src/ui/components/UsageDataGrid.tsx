/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { UsageRecord } from '../types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Trash2 } from 'lucide-react';
import { formatNumber, formatDate } from '../lib/utils';

interface UsageDataGridProps {
  data: UsageRecord[];
  onDataChange: (data: UsageRecord[]) => void;
}

export default function UsageDataGrid({ data, onDataChange }: UsageDataGridProps) {
  const columns = useMemo<ColumnDef<UsageRecord>[]>(
    () => [
      {
        accessorKey: 'food_id',
        header: 'Mã số',
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('food_id')}</div>
        ),
      },
      {
        accessorKey: 'food_name',
        header: 'Thực phẩm',
      },
      {
        accessorKey: 'quantity',
        header: 'Số lượng',
        cell: ({ row }) => {
          const [editing, setEditing] = useState(false);
          const [value, setValue] = useState(row.getValue('quantity') as number);

          return editing ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={() => {
                setEditing(false);
                // Update data
                const newData = [...data];
                newData[row.index] = {
                  ...newData[row.index],
                  quantity: value,
                  total_calorie: value * newData[row.index].quantity, // Recalculate
                };
                onDataChange(newData);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditing(false);
                }
              }}
              className="w-24"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
            >
              {formatNumber(value)}
            </div>
          );
        },
      },
      {
        accessorKey: 'usage_date',
        header: 'Ngày tháng',
        cell: ({ row }) => formatDate(row.getValue('usage_date')),
      },
      {
        accessorKey: 'total_calorie',
        header: 'Tổng Calo',
        cell: ({ row }) => formatNumber(row.getValue('total_calorie')),
      },
      {
        accessorKey: 'calorie_usage',
        header: 'Calo sử dụng',
        cell: ({ row }) => {
          const [editing, setEditing] = useState(false);
          const [value, setValue] = useState((row.getValue('calorie_usage') as number) || 0);

          return editing ? (
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value))}
              onBlur={() => {
                setEditing(false);
                // Update data
                const newData = [...data];
                newData[row.index] = {
                  ...newData[row.index],
                  calorie_usage: value,
                };
                onDataChange(newData);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setEditing(false);
                }
              }}
              className="w-28"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setEditing(true)}
              className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded"
            >
              {value ? formatNumber(value) : '-'}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          return (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newData = data.filter((_, i) => i !== row.index);
                onDataChange(newData);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          );
        },
      },
    ],
    [data, onDataChange]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No data imported yet. Please import Excel file to continue.
      </p>
    );
  }

  return (
    <div className="rounded-md border">
      <table className="w-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b bg-muted/50">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-sm font-medium"
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
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 border-t bg-muted/50">
        <div className="text-sm font-medium">
          Total: {data.length} records | Tổng Calo:{' '}
          {formatNumber(data.reduce((sum, r) => sum + r.total_calorie, 0))}
        </div>
      </div>
    </div>
  );
}

