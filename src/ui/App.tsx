import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import SettingsPage from './pages/SettingsPage';
import UsagePage from './pages/UsagePage';

function App() {
  const [activeTab, setActiveTab] = useState<string>('settings');

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">
            Nutrition App
          </h1>
          <p className="text-muted-foreground">
            Quản lý dinh dưỡng thực phẩm
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="settings">Cài đặt</TabsTrigger>
            <TabsTrigger value="usage">Sử dụng</TabsTrigger>
          </TabsList>

          <TabsContent value="settings">
            <SettingsPage />
          </TabsContent>

          <TabsContent value="usage">
            <UsagePage />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
