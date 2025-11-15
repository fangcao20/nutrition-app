// import { useState } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
//   DialogClose,
// } from './ui/dialog';
// import { Button } from './ui/button';
// import { Input } from './ui/input';
// import { formatNumber } from '../lib/utils';
// import { Food } from '../../../types';

// interface AddFoodModalProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   onSave: (food: Omit<Food, 'id' | 'created_at' | 'updated_at'>) => void;
// }

// export default function AddFoodModal({
//   open,
//   onOpenChange,
//   onSave,
// }: AddFoodModalProps) {
//   const [formData, setFormData] = useState({
//     name: '',
//     origin_name: '',
//     unit: '',
//     calorie_per_unit: '',
//     calorie_usage: '',
//     // HH allocations
//     hh_1_1_ratio: '',
//     hh_1_1_patient: '',
//     hh_2_1_ratio: '',
//     hh_2_1_patient: '',
//     hh_2_2_ratio: '',
//     hh_2_2_patient: '',
//     hh_2_3_ratio: '',
//     hh_2_3_patient: '',
//     hh_3_1_ratio: '',
//     hh_3_1_patient: '',
//     destination_name: '',
//     insurance_type_name: 'Bảo hiểm',
//     apply_date: new Date().toISOString().split('T')[0], // Today's date
//     active: true,
//   });

//   const handleInputChange = (field: string, value: string | boolean) => {
//     setFormData(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };

//   const handleSave = () => {
//     // Validate required fields (all except HH allocations)
//     if (!formData.name || !formData.unit || !formData.calorie_per_unit || 
//         !formData.calorie_usage || !formData.origin_name || !formData.destination_name ||
//         !formData.insurance_type_name || !formData.apply_date) {
//       alert('Vui lòng điền đầy đủ tất cả thông tin bắt buộc');
//       return;
//     }

//     const caloriePerUnit = parseFloat(formData.calorie_per_unit);
    
//     // Helper function to process values that can be % or number
//     const processValueOrPercentage = (value: string): number | string | null => {
//       if (!value) return null;
//       // If contains %, keep as string
//       if (value.includes('%')) {
//         return value;
//       }
//       // If it's a number, parse to number
//       const parsed = parseFloat(value);
//       if (!isNaN(parsed)) {
//         return parsed;
//       }
//       return null;
//     };

//     // Handle calorie_usage - could be number or percentage string
//     const calorieUsage = processValueOrPercentage(formData.calorie_usage);

//     // Helper function to process HH ratio (% or number) - keep as string
//     const processHHRatio = (ratio: string): string | null => {
//       if (!ratio) return null;
//       // If contains %, keep as string
//       if (ratio.includes('%')) {
//         return ratio;
//       }
//       // If it's a number, keep as string but validate it's a valid number
//       const parsed = parseFloat(ratio);
//       if (!isNaN(parsed)) {
//         return ratio; // Keep original string format
//       }
//       return null;
//     };

//     const newFood: Omit<Food, 'id' | 'created_at' | 'updated_at'> = {
//       origin_id: null, // Will be set from backend
//       origin_name: formData.origin_name || undefined,
//       unit: formData.unit,
//       calorie_per_unit: caloriePerUnit,
//       calorie_usage: calorieUsage,
//       base_quantity: 1, // Default value
//       // HH allocations - process ratios to handle % vs numbers
//       hh_1_1_ratio: processHHRatio(formData.hh_1_1_ratio),
//       hh_1_1_patient: formData.hh_1_1_patient || null,
//       hh_2_1_ratio: processHHRatio(formData.hh_2_1_ratio),
//       hh_2_1_patient: formData.hh_2_1_patient || null,
//       hh_2_2_ratio: processHHRatio(formData.hh_2_2_ratio),
//       hh_2_2_patient: formData.hh_2_2_patient || null,
//       hh_2_3_ratio: processHHRatio(formData.hh_2_3_ratio),
//       hh_2_3_patient: formData.hh_2_3_patient || null,
//       hh_3_1_ratio: processHHRatio(formData.hh_3_1_ratio),
//       hh_3_1_patient: formData.hh_3_1_patient || null,
//       loss_ratio: null, // Remove from form
//       destination_id: null, // Will be set from backend
//       destination_name: formData.destination_name || undefined,
//       insurance_type_id: null, // Will be set from backend
//       insurance_type_name: formData.insurance_type_name || undefined,
//       apply_date: formData.apply_date || null,
//       active: formData.active,
//     };

//     onSave(newFood);
//     onOpenChange(false);
    
//     // Reset form
//     setFormData({
//       name: '',
//       origin_name: '',
//       unit: '',
//       calorie_per_unit: '',
//       calorie_usage: '',
//       // HH allocations
//       hh_1_1_ratio: '',
//       hh_1_1_patient: '',
//       hh_2_1_ratio: '',
//       hh_2_1_patient: '',
//       hh_2_2_ratio: '',
//       hh_2_2_patient: '',
//       hh_2_3_ratio: '',
//       hh_2_3_patient: '',
//       hh_3_1_ratio: '',
//       hh_3_1_patient: '',
//       destination_name: '',
//       insurance_type_name: 'Bảo hiểm',
//       apply_date: new Date().toISOString().split('T')[0],
//       active: true,
//     });
//   };

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
//         <DialogClose onClose={() => onOpenChange(false)} />
//         <DialogHeader>
//           <DialogTitle>Thêm thực phẩm mới</DialogTitle>
//         </DialogHeader>

//         <div className="space-y-4">
//           {/* Basic Info - 2 rows, 3 columns */}
//           <div className="grid grid-cols-3 gap-4">
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Tên thực phẩm <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 value={formData.name}
//                 onChange={(e) => handleInputChange('name', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Đơn vị tính <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 value={formData.unit}
//                 onChange={(e) => handleInputChange('unit', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Giá trị/đơn vị <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 type="number"
//                 value={formData.calorie_per_unit}
//                 onChange={(e) => handleInputChange('calorie_per_unit', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-4">
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Calo sử dụng <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 value={formData.calorie_usage}
//                 onChange={(e) => handleInputChange('calorie_usage', e.target.value)}
//                 className="mt-1"
//               />
//               <div className="text-xs text-muted-foreground/70 mt-1">
//                 VD: 7200 hoặc 21.4%
//               </div>
//             </div>
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Nơi lấy mẫu <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 value={formData.origin_name}
//                 onChange={(e) => handleInputChange('origin_name', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Nơi xuất <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 value={formData.destination_name}
//                 onChange={(e) => handleInputChange('destination_name', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           {/* HH Allocations - All in one row */}
//           <div className="space-y-3">
//             <div className="text-sm font-medium text-muted-foreground border-b pb-2">
//               Hao hụt (HH)
//               <div className="text-xs text-muted-foreground/70 mt-1 font-normal">
//                 Tỉ lệ: Nhập số nguyên (VD: 150) hoặc phần trăm (VD: 2.5%)
//               </div>
//             </div>
            
//             {/* All HH Groups in one row */}
//             <div className="grid grid-cols-5 gap-3">
//               {/* HH 1.1 */}
//               <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
//                 <div className="text-xs font-semibold text-yellow-800 mb-2 text-center">HH 1.1</div>
//                 <div className="space-y-2">
//                   <div>
//                     <label className="text-xs text-yellow-700">Tỉ lệ</label>
//                     <Input
//                       value={formData.hh_1_1_ratio}
//                       onChange={(e) => handleInputChange('hh_1_1_ratio', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-yellow-700">Người lấy mẫu</label>
//                     <Input
//                       value={formData.hh_1_1_patient}
//                       onChange={(e) => handleInputChange('hh_1_1_patient', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* HH 2.1 */}
//               <div className="p-2 rounded-lg bg-green-50 border border-green-200">
//                 <div className="text-xs font-semibold text-green-800 mb-2 text-center">HH 2.1</div>
//                 <div className="space-y-2">
//                   <div>
//                     <label className="text-xs text-green-700">Tỉ lệ</label>
//                     <Input
//                       value={formData.hh_2_1_ratio}
//                       onChange={(e) => handleInputChange('hh_2_1_ratio', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-green-700">Người lấy mẫu</label>
//                     <Input
//                       value={formData.hh_2_1_patient}
//                       onChange={(e) => handleInputChange('hh_2_1_patient', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* HH 2.2 */}
//               <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
//                 <div className="text-xs font-semibold text-yellow-800 mb-2 text-center">HH 2.2</div>
//                 <div className="space-y-2">
//                   <div>
//                     <label className="text-xs text-yellow-700">Tỉ lệ</label>
//                     <Input
//                       value={formData.hh_2_2_ratio}
//                       onChange={(e) => handleInputChange('hh_2_2_ratio', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-yellow-700">Người lấy mẫu</label>
//                     <Input
//                       value={formData.hh_2_2_patient}
//                       onChange={(e) => handleInputChange('hh_2_2_patient', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* HH 2.3 */}
//               <div className="p-2 rounded-lg bg-green-50 border border-green-200">
//                 <div className="text-xs font-semibold text-green-800 mb-2 text-center">HH 2.3</div>
//                 <div className="space-y-2">
//                   <div>
//                     <label className="text-xs text-green-700">Tỉ lệ</label>
//                     <Input
//                       value={formData.hh_2_3_ratio}
//                       onChange={(e) => handleInputChange('hh_2_3_ratio', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-green-700">Người lấy mẫu</label>
//                     <Input
//                       value={formData.hh_2_3_patient}
//                       onChange={(e) => handleInputChange('hh_2_3_patient', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* HH 3.1 */}
//               <div className="p-2 rounded-lg bg-yellow-50 border border-yellow-200">
//                 <div className="text-xs font-semibold text-yellow-800 mb-2 text-center">HH 3.1</div>
//                 <div className="space-y-2">
//                   <div>
//                     <label className="text-xs text-yellow-700">Tỉ lệ</label>
//                     <Input
//                       value={formData.hh_3_1_ratio}
//                       onChange={(e) => handleInputChange('hh_3_1_ratio', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-xs text-yellow-700">Người lấy mẫu</label>
//                     <Input
//                       value={formData.hh_3_1_patient}
//                       onChange={(e) => handleInputChange('hh_3_1_patient', e.target.value)}
//                       className="mt-1 text-xs h-7"
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Loại hình <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 value={formData.insurance_type_name}
//                 onChange={(e) => handleInputChange('insurance_type_name', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//             <div>
//               <label className="text-sm font-medium text-muted-foreground">
//                 Ngày áp dụng <span className="text-destructive">*</span>
//               </label>
//               <Input
//                 type="date"
//                 value={formData.apply_date}
//                 onChange={(e) => handleInputChange('apply_date', e.target.value)}
//                 className="mt-1"
//               />
//             </div>
//           </div>

//           {/* Status */}
//           <div className="flex items-center space-x-2">
//             <input
//               type="checkbox"
//               id="active"
//               checked={formData.active}
//               onChange={(e) => handleInputChange('active', e.target.checked)}
//               className="w-4 h-4 text-primary"
//             />
//             <label htmlFor="active" className="text-sm font-medium">
//               Đang hoạt động
//             </label>
//           </div>

//           {/* Preview */}
//           {formData.calorie_per_unit && (
//             <div className="p-4 rounded-lg bg-muted/50 space-y-2">
//               <div className="text-sm font-medium mb-2">Xem trước:</div>
//               <div className="text-sm text-muted-foreground">
//                 Giá trị/đơn vị: {formatNumber(parseFloat(formData.calorie_per_unit))}
//               </div>
//               {/* Show filled HH allocations */}
//               {(formData.hh_1_1_ratio || formData.hh_1_1_patient || 
//                 formData.hh_2_1_ratio || formData.hh_2_1_patient ||
//                 formData.hh_2_2_ratio || formData.hh_2_2_patient ||
//                 formData.hh_2_3_ratio || formData.hh_2_3_patient ||
//                 formData.hh_3_1_ratio || formData.hh_3_1_patient) && (
//                 <div className="text-xs text-muted-foreground border-t pt-2">
//                   <div className="font-medium">Hao hụt đã thiết lập:</div>
//                   <div className="grid grid-cols-2 gap-2 mt-1">
//                     {formData.hh_1_1_ratio && (
//                       <div>HH 1.1: {formData.hh_1_1_ratio} {formData.hh_1_1_patient && `- ${formData.hh_1_1_patient}`}</div>
//                     )}
//                     {formData.hh_2_1_ratio && (
//                       <div>HH 2.1: {formData.hh_2_1_ratio} {formData.hh_2_1_patient && `- ${formData.hh_2_1_patient}`}</div>
//                     )}
//                     {formData.hh_2_2_ratio && (
//                       <div>HH 2.2: {formData.hh_2_2_ratio} {formData.hh_2_2_patient && `- ${formData.hh_2_2_patient}`}</div>
//                     )}
//                     {formData.hh_2_3_ratio && (
//                       <div>HH 2.3: {formData.hh_2_3_ratio} {formData.hh_2_3_patient && `- ${formData.hh_2_3_patient}`}</div>
//                     )}
//                     {formData.hh_3_1_ratio && (
//                       <div>HH 3.1: {formData.hh_3_1_ratio} {formData.hh_3_1_patient && `- ${formData.hh_3_1_patient}`}</div>
//                     )}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>

//         <DialogFooter>
//           <Button variant="outline" onClick={() => onOpenChange(false)}>
//             Hủy
//           </Button>
//           <Button onClick={handleSave}>
//             Thêm mới
//           </Button>
//         </DialogFooter>
//       </DialogContent>
//     </Dialog>
//   );
// }
