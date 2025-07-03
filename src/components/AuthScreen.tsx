import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Smartphone, Shield, QrCode, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmationResult } from 'firebase/auth';
import { cn } from '@/lib/utils';

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

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
    setConfirmationResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-purple-900 flex items-center justify-center p-4 safe-area-inset">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        {/* Floating Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-violet-400 to-purple-400 rounded-full opacity-10 animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full opacity-10 animate-float delay-300"></div>
        </div>

        {/* Header */}
        <div className="text-center space-y-6 relative z-10">
          <div className="flex items-center justify-center">
            <div className="p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-glow animate-bounce-in">
              <QrCode className="h-12 w-12 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold gradient-text animate-slide-in-right delay-200">
              QR Code Studio
            </h1>
            <p className="text-muted-foreground animate-slide-in-left delay-300">
              Generate, track, and analyze your QR codes
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-large backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 animate-scale-in delay-500">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-4">
              <div className={cn(
                "p-3 rounded-full transition-all duration-500",
                step === 'phone' 
                  ? "bg-violet-100 dark:bg-violet-900/30" 
                  : "bg-green-100 dark:bg-green-900/30"
              )}>
                {step === 'phone' ? (
                  <Smartphone className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                ) : (
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl font-semibold">
              {step === 'phone' ? 'Welcome Back' : 'Verify Your Number'}
            </CardTitle>
            <CardDescription className="text-base">
              {step === 'phone' 
                ? 'Enter your phone number to get started'
                : `We've sent a 6-digit code to +91${phoneNumber}`
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'phone' ? (
              <div className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="flex">
                    <div className="flex items-center px-4 border border-r-0 rounded-l-lg bg-muted/50 text-muted-foreground font-medium">
                      +91
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="7397405914"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      className="rounded-l-none text-lg font-medium border-l-0 focus:ring-2 focus:ring-violet-500 transition-all"
                      maxLength={10}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    We'll send you a verification code via SMS
                  </p>
                </div>

                <Button 
                  onClick={handleSendOTP} 
                  disabled={phoneNumber.length !== 10 || loading}
                  className="w-full h-12 text-lg font-medium bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 transition-all duration-300 shadow-medium hover:shadow-large"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                      className="gap-3"
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }, (_, i) => (
                          <InputOTPSlot 
                            key={i} 
                            index={i} 
                            className="w-12 h-12 text-lg font-bold border-2 rounded-lg transition-all duration-200 hover:border-violet-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Enter the 6-digit code sent to your phone
                  </p>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={handleVerifyOTP} 
                    disabled={otp.length !== 6 || loading}
                    className="w-full h-12 text-lg font-medium bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-medium hover:shadow-large"
                    size="lg"
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>

                  <Button 
                    onClick={handleBackToPhone}
                    variant="outline"
                    className="w-full h-12 text-base font-medium border-2 hover:bg-muted/50 transition-all duration-300"
                    disabled={loading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
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
        <div className="text-center text-sm text-muted-foreground animate-fade-in delay-700">
          <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;