import { Card, CardContent } from '../components/ui/card';
import CategoryManagementTable from '../components/CategoryManagementTable';

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <CategoryManagementTable />
        </CardContent>
      </Card>
    </div>
  );
}