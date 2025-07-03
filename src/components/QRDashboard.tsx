import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Eye, QrCode, TrendingUp, Calendar as CalendarIcon, ArrowLeft, Clock, Users, Activity, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, Line, LineChart } from 'recharts';
import { useQR, QRData, ScanData } from '@/contexts/QRContext';
import { format, subDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

// Helper function to format a raw Firestore ScanData object into a display-friendly format
const formatScanData = (scan: ScanData) => {
  const date = scan.timestamp.toDate();
  return {
    timestamp: date.toISOString(),
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString(),
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
};

const QRDashboard = () => {
  const { qrCodes, fetchScanHistory } = useQR();
  
  // State for this component
  const [allScanHistories, setAllScanHistories] = useState<{[key: string]: ScanData[]}>({});
  const [selectedQR, setSelectedQR] = useState<QRData | null>(null);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  // Date range filter state
  const [dateRange, setDateRange] = useState<{from: Date | undefined, to: Date | undefined}>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Effect to fetch detailed scan history when a user clicks on a QR code
  useEffect(() => {
    if (selectedQR && !allScanHistories[selectedQR.id]) {
      setIsHistoryLoading(true);
      fetchScanHistory(selectedQR.id).then(history => {
        setAllScanHistories(prev => ({ ...prev, [selectedQR.id]: history }));
        setIsHistoryLoading(false);
      });
    }
  }, [selectedQR, fetchScanHistory, allScanHistories]);
  
  // Memoized calculation for the main dashboard stats with date filtering
  const stats = useMemo(() => {
    const totalQRs = qrCodes.length;
    const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scans, 0);
    const avgScansPerQR = totalQRs > 0 ? Math.round(totalScans / totalQRs) : 0;
    const activeQRs = qrCodes.filter((qr) => qr.scans > 0).length;
    
    // Filter scans by date range
    const filteredScans = Object.values(allScanHistories).flat().filter(scan => {
      if (!dateRange.from || !dateRange.to) return true;
      const scanDate = scan.timestamp.toDate();
      return isWithinInterval(scanDate, { start: dateRange.from, end: dateRange.to });
    });

    const recentActivity = filteredScans.length;

    const typeScans: { [key: string]: number } = {};
    qrCodes.forEach((qr) => {
      typeScans[qr.type] = (typeScans[qr.type] || 0) + qr.scans;
    });
    const mostScannedType = Object.keys(typeScans).reduce((a, b) => 
      typeScans[a] > typeScans[b] ? a : b, 'none'
    );
    
    return { totalQRs, totalScans, avgScansPerQR, mostScannedType, activeQRs, recentActivity };
  }, [qrCodes, allScanHistories, dateRange]);

  // Memoized calculation for all chart data with date filtering
  const chartData = useMemo(() => {
    const typeChartData = qrCodes.reduce((acc: any[], qr) => {
      const existing = acc.find(item => item.type === qr.type);
      if (existing) {
        existing.count += 1;
        existing.scans += qr.scans;
        existing.avgScans = Math.round(existing.scans / existing.count);
      } else {
        acc.push({ type: qr.type, count: 1, scans: qr.scans, avgScans: qr.scans });
      }
      return acc;
    }, []);

    // Filter scan history by date range
    const filteredScanHistory = Object.values(allScanHistories).flat()
      .filter(scan => {
        if (!dateRange.from || !dateRange.to) return true;
        const scanDate = scan.timestamp.toDate();
        return isWithinInterval(scanDate, { start: dateRange.from, end: dateRange.to });
      })
      .map(formatScanData);

    const dailyActivityData = filteredScanHistory.reduce((acc: any[], scan) => {
      const existing = acc.find(item => item.date === scan.date);
      if (existing) existing.scans += 1;
      else acc.push({ date: scan.date, scans: 1, timestamp: new Date(scan.timestamp).getTime() });
      return acc;
    }, []).sort((a, b) => a.timestamp - b.timestamp);

    const dayOfWeekData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => ({
      day,
      scans: filteredScanHistory.filter(scan => scan.dayOfWeek.startsWith(day.slice(0, 3))).length,
    }));

    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour}:00`,
      scans: filteredScanHistory.filter(scan => new Date(scan.timestamp).getHours() === hour).length,
    }));

    const topPerforming = [...qrCodes].sort((a, b) => b.scans - a.scans).slice(0, 5);
    
    return { typeChartData, dailyActivityData, dayOfWeekData, hourlyData, topPerforming };
  }, [qrCodes, allScanHistories, dateRange]);
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f'];

  // --- INDIVIDUAL QR DETAIL VIEW ---
  if (selectedQR) {
    const currentScanHistory = allScanHistories[selectedQR.id] || [];
    const formattedScanHistory = currentScanHistory.map(formatScanData);

    const qrScansOverTime = formattedScanHistory.reduce((acc: any[], scan) => {
      const existing = acc.find(item => item.date === scan.date);
      if (existing) existing.scans += 1;
      else acc.push({ date: scan.date, scans: 1, timestamp: new Date(scan.timestamp).getTime() });
      return acc;
    }, []).sort((a, b) => a.timestamp - b.timestamp);

    return (
      <div className="space-y-6 animate-in fade-in-50">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedQR(null)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedQR.title}</h2>
            <p className="text-muted-foreground">Individual QR Code Analytics</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedQR.scans}</div>
              <p className="text-xs text-muted-foreground">For this QR code</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QR Type</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{selectedQR.type}</div>
              <p className="text-xs text-muted-foreground">Category</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedQR.createdAt.toDate().toLocaleDateString()}</div>
              <p className="text-xs text-muted-foreground">{selectedQR.createdAt.toDate().toLocaleDateString('en-US', { weekday: 'long' })}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {currentScanHistory.length > 0 ? Math.round(selectedQR.scans / Math.max(1, Math.ceil((Date.now() - selectedQR.createdAt.toDate().getTime()) / (1000*60*60*24)))) : 0}
              </div>
              <p className="text-xs text-muted-foreground">Scans per day</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scan Activity Over Time</CardTitle>
            <CardDescription>Daily scan count for this QR code</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Loading Scan Data...</div>
            ) : qrScansOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={qrScansOverTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="scans" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No scan data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Scan History
            </CardTitle>
            <CardDescription>Last 10 scans for this QR code</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : formattedScanHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Day of Week</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formattedScanHistory.slice(0, 10).map((scan, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{scan.date}</TableCell>
                      <TableCell>{scan.time}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{scan.dayOfWeek}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No scan history available for this QR code.</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Analytics Dashboard
              </CardTitle>
              <CardDescription>View your QR code performance and analytics</CardDescription>
            </div>
            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from && dateRange.to ? (
                    `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
                  ) : (
                    'Select date range'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    setDateRange({ from: range?.from, to: range?.to });
                    if (range?.from && range?.to) {
                      setShowDatePicker(false);
                    }
                  }}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total QRs</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQRs}</div>
            <p className="text-xs text-muted-foreground">Created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scans</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalScans}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Scans</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgScansPerQR}</div>
            <p className="text-xs text-muted-foreground">Per QR code</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active QRs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeQRs}</div>
            <p className="text-xs text-muted-foreground">With activity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Type</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{stats.mostScannedType}</div>
            <p className="text-xs text-muted-foreground">By scans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Period Activity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">Selected period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>QR Type Performance</CardTitle>
            <CardDescription>Comparison across different QR code types</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.typeChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" name="QR Count" />
                  <Bar dataKey="avgScans" fill="#82ca9d" name="Avg Scans" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Scan Activity</CardTitle>
            <CardDescription>Total scans recorded each day</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.dailyActivityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.dailyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="scans" stroke="#8884d8" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">Scan a QR to see activity</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Pattern</CardTitle>
            <CardDescription>Scan activity by day of the week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="scans" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Hourly Activity Pattern</CardTitle>
            <CardDescription>Activity throughout the day (24-hour)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={chartData.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="scans" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing QR Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing QR Codes</CardTitle>
          <CardDescription>Click a code to view its detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.topPerforming.length > 0 ? (
              chartData.topPerforming.map((qr, index) => (
                <div 
                  key={qr.id} 
                  className="flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors" 
                  onClick={() => setSelectedQR(qr)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <Badge variant="outline" className="text-xs">{qr.type}</Badge>
                      <span className="text-xs text-muted-foreground">Created {qr.createdAt.toDate().toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-base font-medium truncate mb-1">{qr.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">{qr.content}</p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-2xl font-bold">{qr.scans}</div>
                    <div className="text-xs text-muted-foreground">scans</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-8">No QR codes found</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRDashboard;