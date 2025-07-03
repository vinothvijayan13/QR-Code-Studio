import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QRGenerator from '@/components/QRGenerator';
import QRDashboard from '@/components/QRDashboard';
import QRHistory from '@/components/QRHistory';
import Header from '@/components/Header';
import { QrCode, BarChart3, History, Sparkles } from 'lucide-react';
import { QRProvider } from '@/contexts/QRContext';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900">
      <Header />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full opacity-5 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/6 w-48 h-48 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-5 animate-float delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full opacity-3 animate-pulse-slow"></div>
      </div>
      
      <div className="container mx-auto mobile-padding py-6 relative z-10">
        <QRProvider>
          {/* Welcome Section */}
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
              <h2 className="text-2xl sm:text-3xl font-bold gradient-text">
                Welcome to Your QR Dashboard
              </h2>
              <Sparkles className="h-6 w-6 text-purple-500 animate-pulse delay-300" />
            </div>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Create, track, and analyze your QR codes with powerful analytics and real-time insights
            </p>
          </div>

          <Tabs defaultValue="generator" className="w-full">
            <div className="flex justify-center mb-8 animate-scale-in delay-300">
              <TabsList className="grid w-full max-w-md grid-cols-3 h-14 p-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-violet-100 dark:border-violet-800 shadow-medium">
                <TabsTrigger 
                  value="generator" 
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Generator</span>
                  <span className="sm:hidden">Gen</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Stats</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="flex items-center gap-2 text-xs sm:text-sm font-medium h-12 rounded-lg transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">History</span>
                  <span className="sm:hidden">List</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="generator" className="mt-0 animate-fade-in">
              <QRGenerator />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0 animate-fade-in">
              <QRDashboard />
            </TabsContent>

            <TabsContent value="history" className="mt-0 animate-fade-in">
              <QRHistory />
            </TabsContent>
          </Tabs>
        </QRProvider>
      </div>
    </div>
  );
};

export default Index;