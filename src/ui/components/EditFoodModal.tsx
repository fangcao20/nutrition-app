import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Food, FoodAllocation } from '../types';
import { formatNumber } from '../lib/utils';

interface AllocationEditorModalProps {
  food: Food | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (foodId: string, allocations: FoodAllocation[], updatedFood?: Partial<Food>) => void;
}

const COMPONENT_CODES = [
  { code: 'HH_1_1', name: 'HH 1.1' },
  { code: 'HH_2_1', name: 'HH 2.1' },
  { code: 'HH_2_2', name: 'HH 2.2' },
  { code: 'HH_2_3', name: 'HH 2.3' },
  { code: 'HH_3_1', name: 'HH 3.1' },
] as const;

// Mock initial allocations
const mockAllocations: Record<string, FoodAllocation[]> = {
  K01: [
    {
      id: 'alloc1',
      food_id: 'K01',
      component_code: 'HH_1_1',
      component_name: 'HH 1.1',
      ratio: 1000,
      ratio_type: 'absolute',
      patient_name: 'BN1',
      created_at: Date.now(),
    },
    {
      id: 'alloc2',
      food_id: 'K01',
      component_code: 'HH_3_1',
      component_name: 'HH 3.1',
      ratio: 4000,
      ratio_type: 'absolute',
      patient_name: 'BN1',
      created_at: Date.now(),
    },
  ],
  K03: [
    {
      id: 'alloc3',
      food_id: 'K03',
      component_code: 'HH_2_1',
      component_name: 'HH 2.1',
      ratio: 0.02,
      ratio_type: 'percentage',
      patient_name: 'BN2',
      created_at: Date.now(),
    },
    {
      id: 'alloc4',
      food_id: 'K03',
      component_code: 'HH_2_2',
      component_name: 'HH 2.2',
      ratio: 0.02,
      ratio_type: 'percentage',
      patient_name: 'BN2',
      created_at: Date.now(),
    },
    {
      id: 'alloc5',
      food_id: 'K03',
      component_code: 'HH_2_3',
      component_name: 'HH 2.3',
      ratio: 0.02,
      ratio_type: 'percentage',
      patient_name: 'BN2',
      created_at: Date.now(),
    },
    {
      id: 'alloc6',
      food_id: 'K03',
      component_code: 'HH_3_1',
      component_name: 'HH 3.1',
      ratio: 0.1,
      ratio_type: 'percentage',
      patient_name: 'BN3',
      created_at: Date.now(),
    },
  ],
};

export default function AllocationEditorModal({
  food,
  open,
  onOpenChange,
  onSave,
}: AllocationEditorModalProps) {
  const [allocations, setAllocations] = useState<
    Record<string, { ratio: string | number; patient: string }>
  >({});

  // Editable food data (excluding readonly fields)
  const [editableFood, setEditableFood] = useState({
    calorie_usage: '',
    destination_name: '',
    insurance_type_name: '',
    apply_date: '',
    active: true,
  });

  useEffect(() => {
    if (food) {
      // Load existing allocations or initialize empty
      const existing = mockAllocations[food.id] || [];
      const allocationMap: Record<string, { ratio: number; patient: string }> = {};
      
      COMPONENT_CODES.forEach(({ code }) => {
        const allocation = existing.find((a) => a.component_code === code);
        allocationMap[code] = {
          ratio: allocation?.ratio || 0,
          patient: allocation?.patient_name || '',
        };
      });
      
      setAllocations(allocationMap);

      // Load editable food data
      setEditableFood({
        calorie_usage: typeof food.calorie_usage === 'number' ? food.calorie_usage.toString() : food.calorie_usage?.toString() || '',
        destination_name: food.destination_name || '',
        insurance_type_name: food.insurance_type_name || '',
        apply_date: food.apply_date || new Date().toISOString().split('T')[0],
        active: food.active,
      });
    }
  }, [food]);

  if (!food) return null;

  const handleRatioChange = (code: string, value: string) => {
    // Store the raw string value to preserve % format
    setAllocations((prev) => ({
      ...prev,
      [code]: { ...prev[code], ratio: value },
    }));
  };

  const handlePatientChange = (code: string, value: string) => {
    setAllocations((prev) => ({
      ...prev,
      [code]: { ...prev[code], patient: value },
    }));
  };

  const handleFoodFieldChange = (field: string, value: string | boolean) => {
    setEditableFood(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateLoss = (code: string): number => {
    const allocation = allocations[code];
    if (!allocation || !allocation.ratio) return 0;

    // Helper to convert ratio to number
    const getRatioAsNumber = (ratio: string | number): number => {
      if (typeof ratio === 'number') return ratio;
      if (ratio.includes('%')) {
        return parseFloat(ratio.replace('%', '')) / 100;
      }
      return parseFloat(ratio) || 0;
    };

    const ratioNum = getRatioAsNumber(allocation.ratio);
    
    // Determine ratio type
    const ratioType = ratioNum < 1 ? 'percentage' : 'absolute';
    
    if (ratioType === 'percentage') {
      // Percentage: Loss = Calorie Usage × Ratio
      const calorieUsage = parseFloat(editableFood.calorie_usage) || 0;
      return calorieUsage * ratioNum;
    } else {
      // Absolute: Loss = Ratio (direct value)
      return ratioNum;
    }
  };

  const calorieUsage = parseFloat(editableFood.calorie_usage) || 0;
  const totalLoss = Object.keys(allocations).reduce(
    (sum, code) => sum + calculateLoss(code),
    0
  );
  const remainingCalorie = calorieUsage - totalLoss;

  // Calculate total percentage ratio for warning
  const totalRatio = Object.values(allocations).reduce((sum, a) => {
    if (!a.ratio) return sum;
    const ratioNum = typeof a.ratio === 'number' 
      ? a.ratio 
      : parseFloat(a.ratio.toString()) || 0;
    return sum + (ratioNum < 1 ? ratioNum * 100 : 0);
  }, 0);

  const handleSave = () => {
    // Helper function to process values that can be % or number
    const processValueOrPercentage = (value: string): number | string | null => {
      if (!value) return null;
      if (value.includes('%')) {
        return value;
      }
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
      return null;
    };

    const allocationsList: FoodAllocation[] = Object.entries(allocations)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .filter(([_, value]) => {
        const ratioNum = typeof value.ratio === 'number' 
          ? value.ratio 
          : parseFloat(value.ratio.toString()) || 0;
        return ratioNum > 0;
      })
      .map(([code, value]) => {
        // Process ratio to handle % or number input, but convert to number for storage
        let finalRatio: number;
        
        if (typeof value.ratio === 'string' && value.ratio.includes('%')) {
          // Convert percentage string to decimal (e.g., "2.5%" -> 0.025)
          finalRatio = parseFloat(value.ratio.replace('%', '')) / 100;
        } else {
          finalRatio = typeof value.ratio === 'number' 
            ? value.ratio 
            : parseFloat(value.ratio.toString()) || 0;
        }
        
        return {
          id: `alloc_${Date.now()}_${code}`,
          food_id: food.id,
          component_code: code as (typeof COMPONENT_CODES)[number]['code'],
          component_name: COMPONENT_CODES.find((c) => c.code === code)?.name || code,
          ratio: finalRatio,
          ratio_type: finalRatio < 1 ? 'percentage' : 'absolute',
          patient_name: value.patient || null,
          created_at: Date.now(),
        };
      });

    // Prepare updated food data
    const updatedFood = {
      calorie_usage: processValueOrPercentage(editableFood.calorie_usage),
      destination_name: editableFood.destination_name || undefined,
      insurance_type_name: editableFood.insurance_type_name || undefined,
      apply_date: editableFood.apply_date || null,
      active: editableFood.active,
    };

    onSave(food.id, allocationsList, updatedFood);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hao hụt - {food.id} ({food.name})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Food Info - Readonly fields */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mã số</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.id}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Thực phẩm</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.name}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Đơn vị</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.unit}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Giá trị/đơn vị</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{formatNumber(food.calorie_per_unit)}</div>
            </div>
          </div>

          {/* Readonly field - Origin name if exists */}
          {food.origin_name && (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nơi lấy mẫu</label>
                <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.origin_name}</div>
              </div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          )}

          {/* Editable fields */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Calo sử dụng <span className="text-destructive">*</span>
              </label>
              <Input
                value={editableFood.calorie_usage}
                onChange={(e) => handleFoodFieldChange('calorie_usage', e.target.value)}
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground/70 mt-1">
                VD: 7200 hoặc 21.4%
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nơi xuất</label>
              <Input
                value={editableFood.destination_name}
                onChange={(e) => handleFoodFieldChange('destination_name', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Loại hình</label>
              <Input
                value={editableFood.insurance_type_name}
                onChange={(e) => handleFoodFieldChange('insurance_type_name', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngày áp dụng</label>
              <Input
                type="date"
                value={editableFood.apply_date}
                onChange={(e) => handleFoodFieldChange('apply_date', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={editableFood.active}
              onChange={(e) => handleFoodFieldChange('active', e.target.checked)}
              className="w-4 h-4 text-primary"
            />
            <label htmlFor="active" className="text-sm font-medium">
              Đang hoạt động
            </label>
          </div>

          {/* HH Allocations - All in one row */}
          <div className="space-y-3">
                        <div className="text-sm font-medium text-muted-foreground border-b pb-2">
              Hao hụt (HH) - Phân bổ theo nhóm
              <div className="text-xs text-muted-foreground/70 mt-1 font-normal">
                Tỉ lệ: Nhập số nguyên (VD: 150) hoặc phần trăm (VD: 2.5%)
              </div>
            </div>
            
            {/* All HH Groups in one row */}
            <div className="grid grid-cols-5 gap-3">
              {COMPONENT_CODES.map(({ code, name }, index) => {
                // Alternate colors: yellow for odd indices (0,2,4), green for even indices (1,3)
                const isYellow = index % 2 === 0;
                const bgColor = isYellow ? 'bg-yellow-50' : 'bg-green-50';
                const borderColor = isYellow ? 'border-yellow-200' : 'border-green-200';
                const headerColor = isYellow ? 'text-yellow-800' : 'text-green-800';
                const labelColor = isYellow ? 'text-yellow-700' : 'text-green-700';
                
                return (
                  <div key={code} className={`p-2 rounded-lg ${bgColor} border ${borderColor}`}>
                    <div className={`text-xs font-semibold ${headerColor} mb-2 text-center`}>{name}</div>
                    <div className="space-y-2">
                      <div>
                        <label className={`text-xs ${labelColor}`}>Tỉ lệ</label>
                        <Input
                          type="number"
                          step="0.01"
                          value={allocations[code]?.ratio || ''}
                          onChange={(e) => handleRatioChange(code, e.target.value)}
                          className="mt-1 text-xs h-7"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${labelColor}`}>Bệnh nhân</label>
                        <Input
                          value={allocations[code]?.patient || ''}
                          onChange={(e) => handlePatientChange(code, e.target.value)}
                          className="mt-1 text-xs h-7"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="text-sm font-medium mb-2">Tóm tắt:</div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Calo sử dụng:</span>
              <span className="font-medium text-sm">{formatNumber(calorieUsage)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tổng hao hụt:</span>
              <span className="font-medium text-sm">{formatNumber(totalLoss)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tổng tỉ lệ:</span>
              <span
                className={`font-medium text-sm ${
                  totalRatio > 100 ? 'text-destructive' : ''
                }`}
              >
                {formatNumber(totalRatio)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Calo còn lại:</span>
              <span
                className={`font-medium text-sm ${
                  remainingCalorie < 0 ? 'text-destructive' : ''
                }`}
              >
                {formatNumber(remainingCalorie)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

