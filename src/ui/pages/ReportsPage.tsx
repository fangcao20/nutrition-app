import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import ReportByPatient from '../components/reports/ReportByPatient';
import ReportByFood from '../components/reports/ReportByFood';

export default function ReportsPage() {
  const [active, setActive] = useState('by-patient');
  return (
    <div className="space-y-6">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          <TabsTrigger value="by-patient" className="text-xs">Người lấy mẫu</TabsTrigger>
          <TabsTrigger value="by-food" className="text-xs">Thực phẩm</TabsTrigger>
        </TabsList>

        <TabsContent value="by-patient">
          <ReportByPatient />
        </TabsContent>

        <TabsContent value="by-food">
          <ReportByFood />
        </TabsContent>
      </Tabs>
    </div>
  );
}
