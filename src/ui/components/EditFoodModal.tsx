import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { FoodWithCategories } from '../../../types/food';
import { formatNumber } from '../lib/utils';

// Format numbers for summary: show 2 decimal places for values < 1 (rounded, not truncated)
const formatSummaryNumber = (value: number): string => {
  if (Math.abs(value) < 1 && value !== 0) {
    return value.toFixed(2);
  }
  return formatNumber(value);
};

interface FoodLossEditorModalProps {
  food: FoodWithCategories | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (updatedFood: Partial<FoodWithCategories>) => void;
}

// HH component configuration
const HH_COMPONENTS = [
  { ratioField: 'hh11Ratio', patientField: 'hh11Patient', name: 'HH 1.1', colorClass: 'yellow' },
  { ratioField: 'hh21Ratio', patientField: 'hh21Patient', name: 'HH 2.1', colorClass: 'green' },
  { ratioField: 'hh22Ratio', patientField: 'hh22Patient', name: 'HH 2.2', colorClass: 'yellow' },
  { ratioField: 'hh23Ratio', patientField: 'hh23Patient', name: 'HH 2.3', colorClass: 'green' },
  { ratioField: 'hh31Ratio', patientField: 'hh31Patient', name: 'HH 3.1', colorClass: 'yellow' },
] as const;

export default function FoodLossEditorModal({
  food,
  open,
  onOpenChange,
  onSave,
}: FoodLossEditorModalProps) {
  const [editableFood, setEditableFood] = useState<Partial<FoodWithCategories>>({});

  useEffect(() => {
    if (food) {
      // Initialize editable fields with current food data
      setEditableFood({
        calorieUsage: food.calorieUsage,
        hh11Ratio: food.hh11Ratio || '',
        hh11Patient: food.hh11Patient || '',
        hh21Ratio: food.hh21Ratio || '',
        hh21Patient: food.hh21Patient || '',
        hh22Ratio: food.hh22Ratio || '',
        hh22Patient: food.hh22Patient || '',
        hh23Ratio: food.hh23Ratio || '',
        hh23Patient: food.hh23Patient || '',
        hh31Ratio: food.hh31Ratio || '',
        hh31Patient: food.hh31Patient || '',
        destinationName: food.destinationName || '',
        insuranceTypeName: food.insuranceTypeName || '',
        applyDate: food.applyDate || new Date().toISOString().split('T')[0],
        active: food.active,
      });
    }
  }, [food]);

  const handleFieldChange = (field: keyof FoodWithCategories, value: string | number | boolean) => {
    setEditableFood(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateLoss = useCallback((ratioField: keyof FoodWithCategories): number => {
    const ratio = editableFood[ratioField] as string;
    if (!ratio) return 0;

    // Helper to convert ratio to number
    const getRatioAsNumber = (ratioStr: string): number => {
      if (ratioStr.includes('%')) {
        return parseFloat(ratioStr.replace('%', '')) / 100;
      }
      return parseFloat(ratioStr) || 0;
    };

    const ratioNum = getRatioAsNumber(ratio);
    
    // Simply return the ratio value - no multiplication
    return ratioNum;
  }, [editableFood]);

  // Calculate values reactively based on editableFood changes using useMemo
  const { calorieUsage, totalLoss, remainingCalorie } = useMemo(() => {
    const calUsage = typeof editableFood.calorieUsage === 'number' 
      ? editableFood.calorieUsage 
      : parseFloat(String(editableFood.calorieUsage || 0)) || 0;
    
    const totLoss = HH_COMPONENTS.reduce(
      (sum, component) => sum + calculateLoss(component.ratioField as keyof FoodWithCategories),
      0
    );
    
    const remCalorie = calUsage - totLoss;

    return {
      calorieUsage: calUsage,
      totalLoss: totLoss,
      remainingCalorie: remCalorie
    };
  }, [editableFood, calculateLoss]);

  if (!food) return null;

  const handleSave = () => {
    // Process the edited data and call onSave
    const updatedData: Partial<FoodWithCategories> = {
      ...editableFood,
      // Ensure numeric fields are properly typed
      calorieUsage: typeof editableFood.calorieUsage === 'number' 
        ? editableFood.calorieUsage 
        : parseFloat(String(editableFood.calorieUsage || 0)) || 0,
      // Save the calculated remaining calories as lossRatio
      lossRatio: remainingCalorie.toString(),
    };

    onSave(updatedData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa hao hụt - {food.foodId} ({food.foodName})</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Food Info - Readonly fields */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Mã số</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.foodId}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Thực phẩm</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.foodName}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Đơn vị</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.unit}</div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Giá trị/đơn vị</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{formatNumber(food.caloriePerUnit)}</div>
            </div>
          </div>

          {/* Readonly field - Origin name if exists */}
          {food.originName && (
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nơi lấy mẫu</label>
                <div className="p-2 rounded border bg-muted/30 text-sm font-medium">{food.originName}</div>
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
                value={editableFood.calorieUsage?.toString() || ''}
                onChange={(e) => handleFieldChange('calorieUsage', e.target.value)}
                className="mt-1"
                placeholder="VD: 7200 hoặc 21.4%"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nơi xuất</label>
              <Input
                value={editableFood.destinationName || ''}
                onChange={(e) => handleFieldChange('destinationName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Loại hình</label>
              <Input
                value={editableFood.insuranceTypeName || ''}
                onChange={(e) => handleFieldChange('insuranceTypeName', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngày áp dụng</label>
              <Input
                type="date"
                value={editableFood.applyDate || ''}
                onChange={(e) => handleFieldChange('applyDate', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              checked={editableFood.active || false}
              onChange={(e) => handleFieldChange('active', e.target.checked)}
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
              {HH_COMPONENTS.map((component) => {
                // Alternate colors: yellow for odd indices (0,2,4), green for even indices (1,3)
                const isYellow = component.colorClass === 'yellow';
                const bgColor = isYellow ? 'bg-yellow-50' : 'bg-green-50';
                const borderColor = isYellow ? 'border-yellow-200' : 'border-green-200';
                const headerColor = isYellow ? 'text-yellow-800' : 'text-green-800';
                const labelColor = isYellow ? 'text-yellow-700' : 'text-green-700';
                
                return (
                  <div key={component.ratioField} className={`p-2 rounded-lg ${bgColor} border ${borderColor}`}>
                    <div className={`text-xs font-semibold ${headerColor} mb-2 text-center`}>{component.name}</div>
                    <div className="space-y-2">
                      <div>
                        <label className={`text-xs ${labelColor}`}>Tỉ lệ</label>
                        <Input
                          value={(editableFood[component.ratioField as keyof FoodWithCategories] as string) || ''}
                          onChange={(e) => handleFieldChange(component.ratioField as keyof FoodWithCategories, e.target.value)}
                          className="mt-1 text-xs h-7"
                        />
                      </div>
                      <div>
                        <label className={`text-xs ${labelColor}`}>Bệnh nhân</label>
                        <Input
                          value={(editableFood[component.patientField as keyof FoodWithCategories] as string) || ''}
                          onChange={(e) => handleFieldChange(component.patientField as keyof FoodWithCategories, e.target.value)}
                          className="mt-1 text-xs h-7"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Calories (Auto-calculated) */}
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Calo còn lại (tự động tính)</label>
              <div className="p-2 rounded border bg-muted/30 text-sm font-medium">
                {formatSummaryNumber(remainingCalorie)}
              </div>
            </div>
            <div></div>
            <div></div>
            <div></div>
          </div>

          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="text-sm font-medium mb-2">Tóm tắt:</div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Calo sử dụng:</span>
              <span className="font-medium text-sm">{formatSummaryNumber(calorieUsage)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Tổng hao hụt:</span>
              <span className="font-medium text-sm">{formatSummaryNumber(totalLoss)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Calo còn lại:</span>
              <span
                className={`font-medium text-sm ${
                  remainingCalorie < 0 ? 'text-destructive' : ''
                }`}
              >
                {formatSummaryNumber(remainingCalorie)}
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

