import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Upload, Download, Calculator } from 'lucide-react';
import type { UsageRecord, CalculationResult } from '../types';
import UsageDataGrid from '../components/UsageDataGrid';
import CalculationResults from '../components/CalculationResults';

// Mock data for testing
const mockUsageData: UsageRecord[] = [
  {
    id: 'usage1',
    food_id: 'K01',
    food_name: 'TP1',
    usage_date: '2025-11-03',
    quantity: 10,
    month: 11,
    year: 2025,
    total_calorie: 175000,
    calorie_usage: 7200,
    notes: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'usage2',
    food_id: 'K02',
    food_name: 'TP2',
    usage_date: '2025-11-03',
    quantity: 100,
    month: 11,
    year: 2025,
    total_calorie: 407000,
    calorie_usage: 0,
    notes: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
  {
    id: 'usage3',
    food_id: 'K03',
    food_name: 'TP3',
    usage_date: '2025-11-03',
    quantity: 10,
    month: 11,
    year: 2025,
    total_calorie: 41000,
    calorie_usage: 0,
    notes: null,
    created_at: Date.now(),
    updated_at: Date.now(),
  },
];

export default function UsagePage() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [usageData, setUsageData] = useState<UsageRecord[]>([]);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleImportMockData = () => {
    setUsageData(mockUsageData);
    setCalculationResult(null);
  };

  const handleCalculate = () => {
    if (usageData.length === 0) return;

    setIsCalculating(true);

    // Mock calculation (will be replaced with real calculation from backend)
    setTimeout(() => {
      const mockResult: CalculationResult = {
        details: usageData.map((record) => ({
          usage_id: record.id,
          food_id: record.food_id,
          food_name: record.food_name || '',
          quantity: record.quantity,
          total_calorie: record.total_calorie,
          calorie_usage: record.calorie_usage || 0,
          components: [
            {
              component_code: 'HH_1_1' as const,
              component_name: 'HH 1.1',
              patient_name: 'BN1',
              ratio: record.food_id === 'K01' ? 1000 : 0,
              ratio_type: 'absolute' as const,
              allocated_calorie: record.food_id === 'K01' ? 10000 : 0,
            },
            {
              component_code: 'HH_2_1' as const,
              component_name: 'HH 2.1',
              patient_name: 'BN2',
              ratio: record.food_id === 'K03' ? 0.02 : 0,
              ratio_type: 'percentage' as const,
              allocated_calorie: record.food_id === 'K03' ? 820 : 0,
            },
            {
              component_code: 'HH_2_2' as const,
              component_name: 'HH 2.2',
              patient_name: 'BN2',
              ratio: record.food_id === 'K03' ? 0.02 : 0,
              ratio_type: 'percentage' as const,
              allocated_calorie: record.food_id === 'K03' ? 820 : 0,
            },
            {
              component_code: 'HH_2_3' as const,
              component_name: 'HH 2.3',
              patient_name: 'BN2',
              ratio: record.food_id === 'K03' ? 0.02 : 0,
              ratio_type: 'percentage' as const,
              allocated_calorie: record.food_id === 'K03' ? 820 : 0,
            },
            {
              component_code: 'HH_3_1' as const,
              component_name: 'HH 3.1',
              patient_name: record.food_id === 'K01' ? 'BN1' : record.food_id === 'K02' ? 'BN2' : 'BN3',
              ratio: record.food_id === 'K01' ? 4000 : record.food_id === 'K02' ? 0.15 : 0.1,
              ratio_type: (record.food_id === 'K01' ? 'absolute' : 'percentage') as 'absolute' | 'percentage',
              allocated_calorie:
                record.food_id === 'K01' ? 40000 : record.food_id === 'K02' ? 61050 : 4100,
            },
          ].filter((c) => c.allocated_calorie > 0),
          remaining_calorie:
            record.total_calorie -
            (record.calorie_usage || 0) -
            (record.food_id === 'K01' ? 50000 : record.food_id === 'K02' ? 61050 : 6560),
        })),
        summary: {
          total_calorie: 623000,
          total_calorie_usage: 7200,
          components: {
            HH_1_1: {
              calorie: 10000,
              patients: ['BN1'],
            },
            HH_2_1: {
              calorie: 820,
              patients: ['BN2'],
            },
            HH_2_2: {
              calorie: 820,
              patients: ['BN2'],
            },
            HH_2_3: {
              calorie: 820,
              patients: ['BN2'],
            },
            HH_3_1: {
              calorie: 105150,
              patients: ['BN1', 'BN2', 'BN3'],
            },
          },
          remaining_calorie: 498390,
        },
      };

      setCalculationResult(mockResult);
      setIsCalculating(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Month/Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Theo dõi sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <label className="text-sm font-medium">Tháng</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Năm</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="ml-2 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
              >
                {Array.from({ length: 5 }, (_, i) => 2024 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1" />
            <Button size="sm" variant="outline" onClick={handleImportMockData}>
              <Upload className="w-4 h-4" />
              Import Excel (Mock)
            </Button>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4" />
              Export Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Import Area */}
      {usageData.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Import Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={handleImportMockData}
            >
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Drag & drop Excel file here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                (Click to load mock data for testing)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Review Data */}
      {usageData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Step 2: Review Data ({usageData.length} records)</CardTitle>
              <Button onClick={handleCalculate} disabled={isCalculating}>
                <Calculator className="w-4 h-4" />
                {isCalculating ? 'Đang tính...' : 'Tính toán'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <UsageDataGrid data={usageData} onDataChange={setUsageData} />
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Step 3: Results</CardTitle>
          </CardHeader>
          <CardContent>
            <CalculationResults result={calculationResult} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
