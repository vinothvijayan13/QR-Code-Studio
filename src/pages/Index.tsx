import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRGenerator from '@/components/QRGenerator';
import QRDashboard from '@/components/QRDashboard';
import QRHistory from '@/components/QRHistory';
import { QrCode, BarChart3, History } from 'lucide-react';
import { QRProvider } from '@/contexts/QRContext'; // 1. Import the provider

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <QrCode className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              QR Code Studio
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate custom QR codes, track scans, and analyze performance with detailed analytics
          </p>
        </div>

        {/* 2. Wrap the main content with the QRProvider */}
        <QRProvider>
          <Tabs defaultValue="generator" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="generator" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                Generator
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="generator">
              <QRGenerator />
            </TabsContent>

            <TabsContent value="analytics">
              <QRDashboard />
            </TabsContent>

            <TabsContent value="history">
              <QRHistory />
            </TabsContent>
          </Tabs>
        </QRProvider>
      </div>
    </div>
  );
};

export default Index;