import { Row } from '@tanstack/react-table';
import { formatNumber } from '../../lib/utils';

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

// Helper functions for filtering
export const textFilter = (row: Row<any>, id: string, value: string[]) => {
  if (!value || value.length === 0) return false;
  const cellValue = row.getValue(id);
  const isEmpty = cellValue === null || cellValue === undefined || cellValue === '';

  if (value.includes('(Trống)') && isEmpty) return true;
  if (!isEmpty && value.includes(formatRatio(String(cellValue)))) return true;

  return false;
}

export const numberFilter = (row: Row<any>, id: string, filter: any) => {
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