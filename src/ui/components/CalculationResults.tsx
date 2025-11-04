import { CalculationResult } from '../types';
import { formatNumber } from '../lib/utils';

interface CalculationResultsProps {
  result: CalculationResult | null;
}

export default function CalculationResults({ result }: CalculationResultsProps) {
  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        Results will appear here after calculation.
      </p>
    );
  }

  const { summary, details } = result;

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="p-6 rounded-lg bg-muted/50 space-y-3">
        <h3 className="font-semibold text-lg mb-4">Tổng kết</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Tổng Calo</div>
            <div className="text-2xl font-bold">{formatNumber(summary.total_calorie)}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Calo sử dụng</div>
            <div className="text-2xl font-bold">{formatNumber(summary.total_calorie_usage)}</div>
          </div>
        </div>

        <div className="border-t pt-3 mt-4">
          <h4 className="font-medium mb-3">Phân bổ theo hợp phần:</h4>
          <div className="space-y-2">
            {Object.entries(summary.components).map(([code, data]) => (
              <div key={code} className="flex justify-between items-center">
                <span className="text-sm">
                  {code.replace('_', ' ')}
                  {data.patients.length > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({data.patients.join(', ')})
                    </span>
                  )}
                </span>
                <span className="font-medium">{formatNumber(data.calorie)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-3 mt-4">
          <div className="flex justify-between items-center">
            <span className="font-medium">Calo còn lại</span>
            <span
              className={`text-xl font-bold ${
                summary.remaining_calorie < 0 ? 'text-destructive' : 'text-green-600'
              }`}
            >
              {formatNumber(summary.remaining_calorie)}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div>
        <h3 className="font-semibold text-lg mb-4">Chi tiết</h3>
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Mã số</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thực phẩm</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Số lượng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Tổng Calo</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Calo sử dụng</th>
                <th className="px-4 py-3 text-right text-sm font-medium">HH 1.1</th>
                <th className="px-4 py-3 text-right text-sm font-medium">HH 2.1</th>
                <th className="px-4 py-3 text-right text-sm font-medium">HH 2.2</th>
                <th className="px-4 py-3 text-right text-sm font-medium">HH 2.3</th>
                <th className="px-4 py-3 text-right text-sm font-medium">HH 3.1</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Còn lại</th>
              </tr>
            </thead>
            <tbody>
              {details.map((detail, idx) => {
                const componentMap = detail.components.reduce((acc, c) => {
                  acc[c.component_code] = c.allocated_calorie;
                  return acc;
                }, {} as Record<string, number>);

                return (
                  <tr key={idx} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{detail.food_id}</td>
                    <td className="px-4 py-3 text-sm">{detail.food_name}</td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(detail.quantity)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(detail.total_calorie)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(detail.calorie_usage)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(componentMap['HH_1_1'] || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(componentMap['HH_2_1'] || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(componentMap['HH_2_2'] || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(componentMap['HH_2_3'] || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {formatNumber(componentMap['HH_3_1'] || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium">
                      {formatNumber(detail.remaining_calorie)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

