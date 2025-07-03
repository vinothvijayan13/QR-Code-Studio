import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRGenerator from '@/components/QRGenerator';
import QRDashboard from '@/components/QRDashboard';
import QRHistory from '@/components/QRHistory';
import Header from '@/components/Header';
import { QrCode, BarChart3, History } from 'lucide-react';
import { QRProvider } from '@/contexts/QRContext';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <QRProvider>
          <Tabs defaultValue="generator" className="w-full">
            <div className="flex justify-center mb-6">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="generator" className="flex items-center gap-2 text-xs sm:text-sm">
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Generator</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2 text-xs sm:text-sm">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2 text-xs sm:text-sm">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="generator" className="mt-0">
              <QRGenerator />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <QRDashboard />
            </TabsContent>

            <TabsContent value="history" className="mt-0">
              <QRHistory />
            </TabsContent>
          </Tabs>
        </QRProvider>
      </div>
    </div>
  );
};

export default Index;