import { Card, CardContent } from '../components/ui/card';
import FoodManagementTable from '../components/FoodManagementTable';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FoodManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}

