import { useState, Component, ReactNode, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { UpdateNotification } from './components/UpdateNotification';
import { FoodPreviewProvider, useFoodPreview } from './components/FoodPreviewContext';
import SettingsPage from './pages/SettingsPage';
import UsagePage from './pages/UsagePage';
import CategoriesPage from './pages/CategoriesPage';
import HistoryPage from './pages/HistoryPage';
import ReportsPage from './pages/ReportsPage';
import AnalysisPage from './pages/AnalysisPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4 text-red-500">Có lỗi xảy ra. Vui lòng tải lại trang.</div>;
    }

    return this.props.children;
  }
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('activeTab') || 'settings';
  });

  const { previewData } = useFoodPreview();

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('activeTab', value);
  };

  // Add beforeunload listener for unsaved preview data
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (previewData && previewData.length > 0) {
        e.preventDefault();
        e.returnValue = 'Bạn có dữ liệu preview thực phẩm chưa lưu. Bạn có chắc muốn thoát?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [previewData]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              Nutrition
            </h1>
          </div>

          {/* Main Content */}
          <ErrorBoundary>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-6">
                <TabsTrigger value="settings">Cài đặt</TabsTrigger>
                <TabsTrigger value="categories">Danh mục</TabsTrigger>
                <TabsTrigger value="usage">Sử dụng</TabsTrigger>
                <TabsTrigger value="history">Lịch sử</TabsTrigger>
                <TabsTrigger value="reports">Báo cáo</TabsTrigger>
                <TabsTrigger value="analysis">Phân tích</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
              <SettingsPage />
            </div>
            <div className={activeTab === 'categories' ? 'block' : 'hidden'}>
              <CategoriesPage />
            </div>
            <div className={activeTab === 'usage' ? 'block' : 'hidden'}>
              <UsagePage />
            </div>
            <div className={activeTab === 'history' ? 'block' : 'hidden'}>
              <HistoryPage />
            </div>
            <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
              <ReportsPage />
            </div>
            <div className={activeTab === 'analysis' ? 'block' : 'hidden'}>
              <AnalysisPage />
            </div>
          </ErrorBoundary>
        </div>
        
        {/* Update notification */}
        <UpdateNotification />
      </div>
    );
}

function App() {
  return (
    <FoodPreviewProvider>
      <AppContent />
    </FoodPreviewProvider>
  );
}

export default App;
