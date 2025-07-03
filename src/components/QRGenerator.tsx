import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Download, Copy, Eye, QrCode as QrCodeIcon, Smartphone, Mail, Phone, MessageSquare, Wifi, FileText, Sparkles, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useQR, QRData } from '@/contexts/QRContext';
import { db } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
    { value: 'url', label: 'Website URL', icon: Smartphone, description: 'Trackable link with analytics', color: 'from-blue-500 to-indigo-600' },
    { value: 'text', label: 'Plain Text', icon: FileText, description: 'Simple text content', color: 'from-gray-500 to-slate-600' },
    { value: 'email', label: 'Email', icon: Mail, description: 'Pre-filled email composition', color: 'from-red-500 to-pink-600' },
    { value: 'phone', label: 'Phone Number', icon: Phone, description: 'Direct phone call', color: 'from-green-500 to-emerald-600' },
    { value: 'sms', label: 'SMS Message', icon: MessageSquare, description: 'Pre-filled text message', color: 'from-yellow-500 to-orange-600' },
    { value: 'wifi', label: 'WiFi Network', icon: Wifi, description: 'WiFi connection details', color: 'from-purple-500 to-violet-600' },
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
        
        // Use the Firebase Cloud Function URL for tracking
        const trackingUrl = `https://us-central1-qr-code-4663c.cloudfunctions.net/track/${newQrFromDb.id}`;
        const dataUrl = await QRCode.toDataURL(trackingUrl, { width: 400, margin: 2 });
        
        const qrDocRef = doc(db, "qrCodes", newQrFromDb.id);
        await updateDoc(qrDocRef, { qrCodeDataUrl: dataUrl });
        setGeneratedQR({ ...newQrFromDb, qrCodeDataUrl: dataUrl });
        
        toast.success('🎉 Trackable QR code generated successfully!');
      } else {
        const dataUrl = await QRCode.toDataURL(rawContent, { width: 400, margin: 2 });
        const newQrFromDb = await addQR({ content: rawContent, destinationUrl: '', type: qrType, title: finalTitle, qrCodeDataUrl: dataUrl });
        if (!newQrFromDb) throw new Error("Failed to save QR to the database.");
        setGeneratedQR(newQrFromDb);
        
        toast.success('✨ QR code generated successfully!');
      }
    } catch (error) {
      console.error("Generation Error:", error);
      toast.error('Failed to generate QR code. Please try again.');
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
    toast.success('📥 QR code downloaded!');
  };

  const copyToClipboard = async () => {
    if (!generatedQR?.qrCodeDataUrl) return;
    try {
      const response = await fetch(generatedQR.qrCodeDataUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      trackQRCopy(generatedQR.id, generatedQR.type, generatedQR.title);
      toast.success('📋 QR code copied to clipboard!');
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
          <div className="space-y-3">
            <Label htmlFor="url" className="text-sm font-medium">Website URL</Label>
            <Input 
              id="url" 
              type="url" 
              placeholder="https://example.com" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)}
              className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-blue-700 dark:text-blue-300">This will be trackable with real-time analytics</p>
            </div>
          </div>
        );
      case 'email':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="contact@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">Subject (Optional)</Label>
              <Input 
                id="subject" 
                placeholder="Email subject" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)}
                className="h-11 transition-all duration-300 focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium">Message (Optional)</Label>
              <Textarea 
                id="message" 
                placeholder="Email message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                rows={3}
                className="transition-all duration-300 focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
        );
      case 'phone':
        return (
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
            <Input 
              id="phone" 
              type="tel" 
              placeholder="+1234567890" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-green-500"
            />
          </div>
        );
      case 'sms':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sms-phone" className="text-sm font-medium">Phone Number</Label>
              <Input 
                id="sms-phone" 
                type="tel" 
                placeholder="+1234567890" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-message" className="text-sm font-medium">Message (Optional)</Label>
              <Textarea 
                id="sms-message" 
                placeholder="SMS message" 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                rows={3}
                className="transition-all duration-300 focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </div>
        );
      case 'wifi':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wifi-name" className="text-sm font-medium">Network Name (SSID)</Label>
              <Input 
                id="wifi-name" 
                placeholder="My WiFi Network" 
                value={wifiName} 
                onChange={(e) => setWifiName(e.target.value)}
                className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-password" className="text-sm font-medium">Password</Label>
              <Input 
                id="wifi-password" 
                type="password" 
                placeholder="WiFi password" 
                value={wifiPassword} 
                onChange={(e) => setWifiPassword(e.target.value)}
                className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wifi-security" className="text-sm font-medium">Security Type</Label>
              <Select value={wifiSecurity} onValueChange={setWifiSecurity}>
                <SelectTrigger className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-purple-500">
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
            <Label htmlFor="content" className="text-sm font-medium">Text Content</Label>
            <Textarea 
              id="content" 
              placeholder="Enter your text here..." 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              rows={4}
              className="transition-all duration-300 focus:ring-2 focus:ring-gray-500"
            />
          </div>
        );
    }
  };

  const selectedQRType = qrTypeOptions.find(option => option.value === qrType);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Card */}
      <Card className="h-fit shadow-large border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-slide-in-left">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-lg">
              <QrCodeIcon className="h-6 w-6 text-white" />
            </div>
            Create QR Code
          </CardTitle>
          <CardDescription className="text-base">Choose a type and fill in the details to generate your QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="title" className="text-sm font-medium">Title (Optional)</Label>
            <Input 
              id="title" 
              placeholder="My QR Code" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base transition-all duration-300 focus:ring-2 focus:ring-violet-500"
            />
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-medium">QR Code Type</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {qrTypeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setQrType(option.value)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300 hover-lift",
                      qrType === option.value 
                        ? `border-transparent bg-gradient-to-r ${option.color} text-white shadow-glow` 
                        : "border-border hover:border-violet-300 dark:hover:border-violet-700 bg-white/50 dark:bg-gray-800/50"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", qrType === option.value ? "text-white" : "text-violet-600")} />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className={cn("text-xs truncate", qrType === option.value ? "text-white/80" : "text-muted-foreground")}>
                        {option.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedQRType && (
            <div className={cn("space-y-4 p-6 rounded-xl border-2 transition-all duration-500 animate-fade-in", 
              `bg-gradient-to-r ${selectedQRType.color} bg-opacity-5 border-opacity-20`)}>
              <div className="flex items-center gap-3">
                <selectedQRType.icon className="h-5 w-5 text-violet-600" />
                <span className="font-semibold text-lg">{selectedQRType.label}</span>
                <Badge variant="outline" className="text-xs bg-white/50">{selectedQRType.description}</Badge>
              </div>
              {renderQRTypeFields()}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={generateQR} 
              disabled={isGenerating} 
              className="flex-1 h-14 text-lg font-semibold bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-medium hover:shadow-large"
              size="lg"
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
                </div>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate QR Code
                </>
              )}
            </Button>
            {generatedQR && (
              <Button 
                onClick={resetForm} 
                variant="outline" 
                size="lg"
                className="h-14 px-6 border-2 hover:bg-muted/50 transition-all duration-300"
              >
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Display Card */}
      <Card className="h-fit shadow-large border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm animate-slide-in-right">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">Generated QR Code</CardTitle>
          <CardDescription className="text-base">Your QR code will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          {generatedQR ? (
            <div className="space-y-6 animate-bounce-in">
              <div className="flex justify-center">
                <div className="p-6 bg-white rounded-2xl shadow-large border-2 border-violet-100 dark:border-violet-800 hover-lift transition-smooth">
                  <img src={generatedQR.qrCodeDataUrl} alt="Generated QR Code" className="w-64 h-64" />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-center space-y-3">
                  <h3 className="font-bold text-xl gradient-text">{generatedQR.title}</h3>
                  <div className="flex items-center justify-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">{generatedQR.type.toUpperCase()}</Badge>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      <span className="font-medium">{generatedQR.scans} scans</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-xl border">
                  <p className="text-sm text-muted-foreground mb-2 font-medium">Content:</p>
                  <p className="text-sm font-mono break-all bg-white/50 dark:bg-gray-800/50 p-3 rounded-lg">{generatedQR.content}</p>
                </div>

                {generatedQR.type === 'url' && (
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Tracking Enabled</p>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      This QR code will redirect through our analytics system to track scans and provide detailed insights.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    onClick={downloadQR} 
                    variant="outline" 
                    size="lg" 
                    className="h-12 border-2 hover:bg-green-50 hover:border-green-300 dark:hover:bg-green-900/20 transition-all duration-300"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    onClick={copyToClipboard} 
                    variant="outline" 
                    size="lg"
                    className="h-12 border-2 hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-900/20 transition-all duration-300"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-muted-foreground">
              <div className="text-center space-y-6 animate-fade-in">
                <div className="relative">
                  <QrCodeIcon className="h-24 w-24 mx-auto opacity-20 animate-pulse-slow" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-violet-400 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-lg">Ready to Generate</p>
                  <p className="text-sm max-w-xs mx-auto">Choose a QR type and fill in the details to create your custom QR code</p>
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