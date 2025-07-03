import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Eye, Download, Copy, Trash2, Search, Calendar, QrCode, ArrowLeft, Clock, Edit, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useQR, QRData, ScanData } from '@/contexts/QRContext';

const QRHistory = () => {
  const { qrCodes, deleteQR, fetchScanHistory, updateQRDestination } = useQR();
  const { trackQRDownload, trackQRCopy } = useAnalytics();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedQR, setSelectedQR] = useState<QRData | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanData[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [scanHistoryPage, setScanHistoryPage] = useState(1);
  const itemsPerPage = 9;
  const scansPerPage = 10;

  // State for the edit dialog
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingQR, setEditingQR] = useState<QRData | null>(null);
  const [newDestinationUrl, setNewDestinationUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedQR) {
      setIsHistoryLoading(true);
      fetchScanHistory(selectedQR.id).then(history => {
        setScanHistory(history);
        setIsHistoryLoading(false);
      });
    }
  }, [selectedQR, fetchScanHistory]);

  const filteredQRs = useMemo(() => {
    let filtered = qrCodes.filter(qr => {
      const matchesSearch = qr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (qr.content && qr.content.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || qr.type === typeFilter;
      return matchesSearch && matchesType;
    });

    return [...filtered].sort((a, b) => {
      const dateA = a.createdAt.toDate().getTime();
      const dateB = b.createdAt.toDate().getTime();
      switch (sortBy) {
        case 'oldest': return dateA - dateB;
        case 'most-scanned': return b.scans - a.scans;
        case 'least-scanned': return a.scans - b.scans;
        case 'alphabetical': return a.title.localeCompare(b.title);
        case 'newest':
        default: return dateB - dateA;
      }
    });
  }, [qrCodes, searchTerm, typeFilter, sortBy]);

  const handleEditClick = (e: React.MouseEvent, qr: QRData) => {
    e.stopPropagation();
    setEditingQR(qr);
    setNewDestinationUrl(qr.destinationUrl);
    setIsEditDialogOpen(true);
  };

  const handleSaveChanges = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingQR) return;
    setIsSaving(true);
    try {
      await updateQRDestination(editingQR.id, newDestinationUrl);
      setIsEditDialogOpen(false);
      setEditingQR(null);
    } catch (error) {
      // error toast is handled in context
    } finally {
      setIsSaving(false);
    }
  };

  const downloadQR = (qr: QRData) => {
    if (!qr.qrCodeDataUrl) { toast.error("Image data not available."); return; }
    const link = document.createElement('a');
    link.download = `${qr.title}.png`;
    link.href = qr.qrCodeDataUrl;
    link.click();
    trackQRDownload(qr.id, qr.type, qr.title);
    toast.success('QR code downloaded!');
  };

  const copyToClipboard = async (qr: QRData) => {
    if (!qr.qrCodeDataUrl) { toast.error("Image data not available."); return; }
    try {
      const response = await fetch(qr.qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([ new ClipboardItem({ 'image/png': blob }) ]);
      trackQRCopy(qr.id, qr.type, qr.title);
      toast.success('QR code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy QR code');
    }
  };

  const getUniqueTypes = useMemo(() => [...new Set(qrCodes.map(qr => qr.type))], [qrCodes]);

  const totalPages = Math.ceil(filteredQRs.length / itemsPerPage);
  const currentQRs = filteredQRs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalScanPages = Math.ceil(scanHistory.length / scansPerPage);
  const currentScans = scanHistory.slice((scanHistoryPage - 1) * scansPerPage, scanHistoryPage * scansPerPage);

  if (selectedQR) {
    return (
      <div className="space-y-6 animate-in fade-in-50">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => setSelectedQR(null)} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to History
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{selectedQR.title}</h2>
            <p className="text-muted-foreground">Scan History Details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedQR.scans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">QR Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary">{selectedQR.type.toUpperCase()}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">{selectedQR.createdAt.toDate().toLocaleDateString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Last Updated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {selectedQR.updatedAt ? selectedQR.updatedAt.toDate().toLocaleDateString() : 'Never'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scan History
            </CardTitle>
            <CardDescription>Detailed scan records for this QR code</CardDescription>
          </CardHeader>
          <CardContent>
            {isHistoryLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading scan history...</div>
            ) : currentScans.length > 0 ? (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentScans.map((scan) => {
                      const scanDate = scan.timestamp.toDate();
                      return (
                        <TableRow key={scan.id}>
                          <TableCell className="font-medium">
                            {scanDate.toLocaleDateString()} {scanDate.toLocaleTimeString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {scanDate.toLocaleDateString('en-US', { weekday: 'long' })}
                            </Badge>
                          </TableCell>
                          <TableCell>{scanDate.toLocaleTimeString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalScanPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setScanHistoryPage(Math.max(1, scanHistoryPage - 1))}
                          className={scanHistoryPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalScanPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setScanHistoryPage(page)}
                            isActive={page === scanHistoryPage}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setScanHistoryPage(Math.min(totalScanPages, scanHistoryPage + 1))}
                          className={scanHistoryPage === totalScanPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No scan history available for this QR code.</div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code History
          </CardTitle>
          <CardDescription>Manage and view all your created QR codes</CardDescription>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search QR Codes</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type-filter">Filter by Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {getUniqueTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-scanned">Most Scanned</SelectItem>
                  <SelectItem value="least-scanned">Least Scanned</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Results</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                <span className="text-sm text-muted-foreground">
                  {filteredQRs.length} QR code{filteredQRs.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredQRs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentQRs.map((qr) => (
              <Card key={qr.id} className="group hover:shadow-lg transition-all flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{qr.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{qr.type.toUpperCase()}</Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Eye className="h-3 w-3" />
                          {qr.scans}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => { e.stopPropagation(); deleteQR(qr.id); }} 
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-center mb-4">
                      <div className="p-2 bg-white rounded border">
                        <img src={qr.qrCodeDataUrl} alt={qr.title} className="w-32 h-32"/>
                      </div>
                    </div>
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Content:</div>
                      <div className="truncate font-mono text-xs bg-muted p-2 rounded">{qr.content}</div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                      <Calendar className="h-4 w-4" />
                      {qr.createdAt.toDate().toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedQR(qr)} 
                      className="w-full" 
                      disabled={qr.scans === 0}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      View Scan History
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={(e) => { e.stopPropagation(); downloadQR(qr); }}
                      >
                        <Download className="h-4 w-4 mr-2" />Download
                      </Button>
                      {qr.type === 'url' ? (
                        <Dialog open={isEditDialogOpen && editingQR?.id === qr.id} onOpenChange={(open) => { if (!open) setEditingQR(null); setIsEditDialogOpen(open); }}>
                          <DialogTrigger asChild>
                            <Button variant="secondary" size="sm" onClick={(e) => handleEditClick(e, qr)}>
                              <Edit className="h-4 w-4 mr-2" />Edit URL
                            </Button>
                          </DialogTrigger>
                          <DialogContent onClick={(e) => e.stopPropagation()}>
                            <DialogHeader>
                              <DialogTitle>Edit Destination URL</DialogTitle>
                              <DialogDescription>
                                Change where this QR code redirects. The QR image will not change.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-2">
                              <Label htmlFor="destination-url">New Destination URL</Label>
                              <Input 
                                id="destination-url" 
                                value={newDestinationUrl} 
                                onChange={(e) => setNewDestinationUrl(e.target.value)} 
                                placeholder="https://new-destination.com" 
                              />
                              <p className="text-xs text-muted-foreground">
                                Current: {editingQR?.destinationUrl}
                              </p>
                            </div>
                            <DialogFooter>
                              <DialogClose asChild>
                                <Button type="button" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                  Cancel
                                </Button>
                              </DialogClose>
                              <Button 
                                type="submit" 
                                disabled={isSaving || newDestinationUrl === editingQR?.destinationUrl} 
                                onClick={handleSaveChanges}
                              >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={(e) => { e.stopPropagation(); copyToClipboard(qr); }}
                        >
                          <Copy className="h-4 w-4 mr-2" />Copy
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={page === currentPage}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <QrCode className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No QR codes found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || typeFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria' 
                : 'Create your first QR code to get started'
              }
            </p>
            {(searchTerm || typeFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => { setSearchTerm(''); setTypeFilter('all'); }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QRHistory;