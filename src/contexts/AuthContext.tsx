import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  RecaptchaVerifier, 
  ConfirmationResult,
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import { toast } from 'sonner';

export interface UserProfile {
  uid: string;
  email?: string;
  phoneNumber?: string;
  displayName?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  isAdmin?: boolean;
  qrCodesCount?: number;
  totalScans?: number;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  sendOTP: (phoneNumber: string) => Promise<ConfirmationResult | null>;
  verifyOTP: (confirmationResult: ConfirmationResult, otp: string, userData?: { name: string }) => Promise<boolean>;
  signOut: () => Promise<void>;
  setupRecaptcha: () => RecaptchaVerifier;
  registerWithEmail: (email: string, password: string, name: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const createUserProfile = async (user: User, additionalData: any = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        const userData: UserProfile = {
          uid: user.uid,
          email: user.email || undefined,
          phoneNumber: user.phoneNumber || undefined,
          displayName: user.displayName || additionalData.name || undefined,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now(),
          isAdmin: user.email === 'vinothvijayan13@gmail.com',
          qrCodesCount: 0,
          totalScans: 0,
          ...additionalData
        };
        
        await setDoc(userRef, userData);
        setUserProfile(userData);
      } else {
        // Update last login
        await setDoc(userRef, { lastLoginAt: Timestamp.now() }, { merge: true });
        setUserProfile(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  };

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

  const verifyOTP = async (confirmationResult: ConfirmationResult, otp: string, userData?: { name: string }): Promise<boolean> => {
    try {
      const result = await confirmationResult.confirm(otp);
      if (result.user && userData?.name) {
        await updateProfile(result.user, { displayName: userData.name });
      }
      await createUserProfile(result.user, userData);
      toast.success('Phone number verified successfully!');
      return true;
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast.error('Invalid OTP. Please try again.');
      return false;
    }
  };

  const registerWithEmail = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      await createUserProfile(result.user, { name });
      toast.success('Account created successfully!');
      return true;
    } catch (error: any) {
      console.error('Error registering:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
      return false;
    }
  };

  const loginWithEmail = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user);
      toast.success('Signed in successfully!');
      return true;
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error(error.message || 'Failed to sign in. Please check your credentials.');
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

  const isAdmin = userProfile?.isAdmin || false;

  const value = {
    user,
    userProfile,
    loading,
    sendOTP,
    verifyOTP,
    signOut,
    setupRecaptcha,
    registerWithEmail,
    loginWithEmail,
    isAdmin
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