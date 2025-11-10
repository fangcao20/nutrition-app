import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import HistoryManagementTable from '../components/HistoryManagementTable';

const HistoryPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử sử dụng</CardTitle>
        </CardHeader>
        <CardContent>
          <HistoryManagementTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryPage;