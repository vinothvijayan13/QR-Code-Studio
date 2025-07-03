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
import { Eye, Download, Copy, Trash2, Search, Calendar, QrCode, ArrowLeft, Clock, Edit } from 'lucide-react';
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
    // ... filtering and sorting logic remains the same
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

  // ... downloadQR, copyToClipboard, getUniqueTypes functions remain the same
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

  if (selectedQR) { /* ... Detailed QR View remains the same ... */ }

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* ... Header and Filter Cards remain the same ... */}
      
      {filteredQRs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentQRs.map((qr) => (
              <Card key={qr.id} className="group hover:shadow-lg transition-all flex flex-col">
                <CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex-1 min-w-0"><CardTitle className="text-lg truncate">{qr.title}</CardTitle><div className="flex items-center gap-2 mt-1"><Badge variant="secondary">{qr.type.toUpperCase()}</Badge><div className="flex items-center gap-1 text-sm text-muted-foreground"><Eye className="h-3 w-3" />{qr.scans}</div></div></div><Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); deleteQR(qr.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></div></CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-center mb-4"><div className="p-2 bg-white rounded border"><img src={qr.qrCodeDataUrl} alt={qr.title} className="w-32 h-32"/></div></div>
                    <div className="text-sm"><div className="text-muted-foreground mb-1">Content:</div><div className="truncate font-mono text-xs bg-muted p-2 rounded">{qr.content}</div></div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2"><Calendar className="h-4 w-4" />{qr.createdAt.toDate().toLocaleDateString()}</div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedQR(qr)} className="w-full" disabled={qr.scans === 0}><Clock className="h-4 w-4 mr-2" />View Scan History</Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); downloadQR(qr); }}><Download className="h-4 w-4 mr-2" />Download</Button>
                        {qr.type === 'url' ? (
                          <Dialog open={isEditDialogOpen && editingQR?.id === qr.id} onOpenChange={(open) => { if (!open) setEditingQR(null); setIsEditDialogOpen(open); }}>
                            <DialogTrigger asChild><Button variant="secondary" size="sm" onClick={(e) => handleEditClick(e, qr)}><Edit className="h-4 w-4 mr-2" />Edit URL</Button></DialogTrigger>
                            <DialogContent onClick={(e) => e.stopPropagation()}>
                              <DialogHeader><DialogTitle>Edit Destination URL</DialogTitle><DialogDescription>Change where this QR code redirects. The QR image will not change.</DialogDescription></DialogHeader>
                              <div className="py-4 space-y-2"><Label htmlFor="destination-url">New Destination URL</Label><Input id="destination-url" value={newDestinationUrl} onChange={(e) => setNewDestinationUrl(e.target.value)} placeholder="https://new-destination.com" /><p className="text-xs text-muted-foreground">Current: {editingQR?.destinationUrl}</p></div>
                              <DialogFooter><DialogClose asChild><Button type="button" variant="ghost" onClick={(e) => e.stopPropagation()}>Cancel</Button></DialogClose><Button type="submit" disabled={isSaving || newDestinationUrl === editingQR?.destinationUrl} onClick={handleSaveChanges}>{isSaving ? 'Saving...' : 'Save Changes'}</Button></DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); copyToClipboard(qr); }}><Copy className="h-4 w-4 mr-2" />Copy</Button>
                        )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {/* ... Pagination remains the same ... */}
        </>
      ) : (
        // ... "No QR codes" message remains the same ...
        <></>
      )}
    </div>
  );
};

export default QRHistory;