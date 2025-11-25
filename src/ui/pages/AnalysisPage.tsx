import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import AnalysisByPatient from '../components/analysis/AnalysisByPatient';
import AnalysisByFood from '../components/analysis/AnalysisByFood';

export default function AnalysisPage() {
  const [active, setActive] = useState('by-patient');
  return (
    <div className="space-y-6">
      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          <TabsTrigger value="by-patient" className="text-xs">Người lấy mẫu</TabsTrigger>
          <TabsTrigger value="by-food" className="text-xs">Thực phẩm</TabsTrigger>
        </TabsList>

        <TabsContent value="by-patient">
          <AnalysisByPatient />
        </TabsContent>

        <TabsContent value="by-food">
          <AnalysisByFood />
        </TabsContent>
      </Tabs>
    </div>
  );
}