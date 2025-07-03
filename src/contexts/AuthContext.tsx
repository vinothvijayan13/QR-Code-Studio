import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '@/firebase';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult | null>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  setupRecaptcha: () => RecaptchaVerifier;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setupRecaptcha = (): RecaptchaVerifier => {
    return new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        toast.error('reCAPTCHA expired. Please try again.');
      }
    });
  };

  const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult | null> => {
    try {
      // Format phone number to include country code if not present
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      
      const recaptchaVerifier = setupRecaptcha();
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      
      toast.success('OTP sent successfully!');
      return confirmationResult;
    } catch (error: any) {
      console.error('Error sending OTP:', error);
      toast.error(error.message || 'Failed to send OTP. Please try again.');
      return null;
    }
  };

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string): Promise<boolean> => {
    try {
      await confirmationResult.confirm(otp);
      toast.success('Phone number verified successfully!');
      return true;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
      return false;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully!');
    } catch (error: any) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
    }
  };

  const value = {
    user,
    loading,
    sendOTP,
    verifyOTP,
    signOut,
    setupRecaptcha
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};