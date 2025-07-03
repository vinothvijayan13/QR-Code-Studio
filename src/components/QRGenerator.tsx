import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Eye, QrCode as QrCodeIcon, Smartphone, Mail, Phone, MessageSquare, Wifi, FileText } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useQR, QRData } from '@/contexts/QRContext';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const QRGenerator = () => {
  const { addQR } = useQR();
  const { trackQRDownload, trackQRCopy } = useAnalytics();

  // State for the form itself
  const [qrType, setQrType] = useState('url');
  const [title, setTitle] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<QRData | null>(null);

  // State for all the different input fields
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [content, setContent] = useState('');
  const [wifiName, setWifiName] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');

  const qrTypeOptions = [
    { value: 'url', label: 'Website URL', icon: Smartphone, description: 'Trackable link with analytics' },
    { value: 'text', label: 'Plain Text', icon: FileText, description: 'Simple text content' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Pre-filled email composition' },
    { value: 'phone', label: 'Phone Number', icon: Phone, description: 'Direct phone call' },
    { value: 'sms', label: 'SMS Message', icon: MessageSquare, description: 'Pre-filled text message' },
    { value: 'wifi', label: 'WiFi Network', icon: Wifi, description: 'WiFi connection details' },
  ];

  const generateQRContent = () => {
    switch (qrType) {
      case 'url': return url;
      case 'email': return `mailto:${email}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}${message ? `&body=${encodeURIComponent(message)}` : ''}`;
      case 'phone': return `tel:${phone}`;
      case 'sms': return `sms:${phone}${message ? `&body=${encodeURIComponent(message)}` : ''}`;
      case 'wifi': return `WIFI:T:${wifiSecurity};S:${wifiName};P:${wifiPassword};;`;
      case 'text':
      default: return content;
    }
  };

  const generateQR = async () => {
    const rawContent = generateQRContent();
    if (!rawContent.trim()) {
      toast.error('Please enter content for your QR code');
      return;
    }
    setIsGenerating(true);
    const isDynamic = qrType === 'url';
    const finalTitle = title || `${qrType.toUpperCase()} QR Code`;
    try {
      if (isDynamic) {
        const destinationUrl = rawContent;
        const newQrFromDb = await addQR({ content: rawContent, destinationUrl: destinationUrl, type: qrType, title: finalTitle });
        if (!newQrFromDb) throw new Error("Failed to save QR to the database.");
        const trackingUrl = `${import.meta.env.VITE_TRACKING_FUNCTION_URL}/${newQrFromDb.id}`;
        const dataUrl = await QRCode.toDataURL(trackingUrl, { width: 400, margin: 2 });
        const qrDocRef = doc(db, "qrCodes", newQrFromDb.id);
        await updateDoc(qrDocRef, { qrCodeDataUrl: dataUrl });
        setGeneratedQR({ ...newQrFromDb, qrCodeDataUrl: dataUrl });
      } else {
        const dataUrl = await QRCode.toDataURL(rawContent, { width: 400, margin: 2 });
        const newQrFromDb = await addQR({ content: rawContent, destinationUrl: '', type: qrType, title: finalTitle, qrCodeDataUrl: dataUrl });
        if (!newQrFromDb) throw new Error("Failed to save QR to the database.");
        setGeneratedQR(newQrFromDb);
      }
    } catch (error) {
      console.error("Generation Error:", error);
      toast.error('Failed to generate QR code. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQR = () => {
    if (!generatedQR?.qrCodeDataUrl) return;
    const link = document.createElement('a');
    link.download = `${generatedQR.title}.png`;
    link.href = generatedQR.qrCodeDataUrl;
    link.click();
    trackQRDownload(generatedQR.id, generatedQR.type, generatedQR.title);
    toast.success('QR code downloaded!');
  };

  const copyToClipboard = async () => {
    if (!generatedQR?.qrCodeDataUrl) return;
    try {
      const response = await fetch(generatedQR.qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      trackQRCopy(generatedQR.id, generatedQR.type, generatedQR.title);
      toast.success('QR code copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy QR code');
    }
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setEmail('');
    setSubject('');
    setMessage('');
    setPhone('');
    setContent('');
    setWifiName('');
    setWifiPassword('');
    setGeneratedQR(null);
  };

  const renderQRTypeFields = () => {
    switch (qrType) {
      case 'url':
        return (
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <Input 
              id="url" 
              type="url" 
              placeholder="https://example.com" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
            />
            <p className="text-xs text-muted-foreground">This will be trackable with analytics</p>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="contact@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input 
                id="subject" 
                placeholder="Email subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea 
                id="message" 
                placeholder="Email message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                rows={3}
              />
            </div>
          </div>
        );
      case 'phone':
        return (
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+1234567890" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
            />
          </div>
        );
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-phone">Phone Number</Label>
              <Input 
                id="sms-phone" 
                type="tel" 
                placeholder="+1234567890" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message">Message (Optional)</Label>
              <Textarea 
                id="sms-message" 
                placeholder="SMS message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                rows={3}
              />
            </div>
          </div>
        );
      case 'wifi':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wifi-name">Network Name (SSID)</Label>
              <Input 
                id="wifi-name" 
                placeholder="My WiFi Network" 
                value={wifiName} 
                onChange={(e) => setWifiName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-password">Password</Label>
              <Input 
                id="wifi-password" 
                type="password" 
                placeholder="WiFi password" 
                value={wifiPassword} 
                onChange={(e) => setWifiPassword(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-security">Security Type</Label>
              <Select value={wifiSecurity} onValueChange={setWifiSecurity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WPA">WPA/WPA2</SelectItem>
                  <SelectItem value="WEP">WEP</SelectItem>
                  <SelectItem value="nopass">No Password</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-2">
            <Label htmlFor="content">Text Content</Label>
            <Textarea 
              id="content" 
              placeholder="Enter your text here..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              rows={4}
            />
          </div>
        );
    }
  };

  const selectedQRType = qrTypeOptions.find(option => option.value === qrType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Card */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-5 w-5" />
            Create QR Code
          </CardTitle>
          <CardDescription>Choose a type and fill in the details to generate your QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input 
              id="title" 
              placeholder="My QR Code" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="qr-type">QR Code Type</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {qrTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setQrType(option.value)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border text-left transition-all hover:bg-accent/50",
                      qrType === option.value ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <Icon className="h-4 w-4 text-primary" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{option.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedQRType && (
            <div className="space-y-4 p-4 bg-accent/20 rounded-lg">
              <div className="flex items-center gap-2">
                <selectedQRType.icon className="h-4 w-4 text-primary" />
                <span className="font-medium">{selectedQRType.label}</span>
                <Badge variant="outline" className="text-xs">{selectedQRType.description}</Badge>
              </div>
              {renderQRTypeFields()}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={generateQR} disabled={isGenerating} className="flex-1" size="lg">
              {isGenerating ? 'Generating...' : 'Generate QR Code'}
            </Button>
            {generatedQR && (
              <Button onClick={resetForm} variant="outline" size="lg">
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Display Card */}
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Generated QR Code</CardTitle>
          <CardDescription>Your QR code will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          {generatedQR ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="p-6 bg-white rounded-xl shadow-sm border">
                  <img src={generatedQR.qrCodeDataUrl} alt="Generated QR Code" className="w-64 h-64" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <h3 className="font-semibold text-lg">{generatedQR.title}</h3>
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant="secondary">{generatedQR.type.toUpperCase()}</Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span>{generatedQR.scans} scans</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Content:</p>
                  <p className="text-sm font-mono break-all">{generatedQR.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={downloadQR} variant="outline" size="sm" className="w-full">
                    <Download className="h-4 w-4 mr-2" />Download
                  </Button>
                  <Button onClick={copyToClipboard} variant="outline" size="sm" className="w-full">
                    <Copy className="h-4 w-4 mr-2" />Copy
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-80 text-muted-foreground">
              <div className="text-center space-y-4">
                <QrCodeIcon className="h-16 w-16 mx-auto opacity-50" />
                <div>
                  <p className="font-medium">Generate a QR code to see it here</p>
                  <p className="text-sm">Choose a type and fill in the details above</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QRGenerator;