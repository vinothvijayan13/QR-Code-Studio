import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Smartphone, Shield, QrCode } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmationResult } from 'firebase/auth';

const AuthScreen = () => {
  const { sendOTP, verifyOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      return;
    }

    setLoading(true);
    const result = await sendOTP(phoneNumber);
    
    if (result) {
      setConfirmationResult(result);
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || !confirmationResult) {
      return;
    }

    setLoading(true);
    const success = await verifyOTP(confirmationResult, otp);
    
    if (!success) {
      setOtp('');
    }
    setLoading(false);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setPhoneNumber(value);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 6) {
      setOtp(value);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <QrCode className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              QR Code Studio
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to access your QR codes and analytics
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-2">
              {step === 'phone' ? (
                <Smartphone className="h-6 w-6 text-primary" />
              ) : (
                <Shield className="h-6 w-6 text-primary" />
              )}
            </div>
            <CardTitle className="text-xl">
              {step === 'phone' ? 'Enter Phone Number' : 'Verify OTP'}
            </CardTitle>
            <CardDescription>
              {step === 'phone' 
                ? 'We\'ll send you a verification code via SMS'
                : `Enter the 6-digit code sent to +91${phoneNumber}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'phone' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="7397405914"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      className="rounded-l-none"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter your 10-digit mobile number
                  </p>
                </div>

                <Button 
                  onClick={handleSendOTP} 
                  disabled={phoneNumber.length !== 10 || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={handleOtpChange}
                    className="text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleVerifyOTP} 
                    disabled={otp.length !== 6 || loading}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? 'Verifying...' : 'Verify & Sign In'}
                  </Button>

                  <Button 
                    onClick={handleBackToPhone}
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    Change Phone Number
                  </Button>
                </div>
              </div>
            )}

            {/* reCAPTCHA container */}
            <div id="recaptcha-container"></div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>By signing in, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;