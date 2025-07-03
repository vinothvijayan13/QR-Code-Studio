import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { db } from '@/firebase';
import { collection, addDoc, onSnapshot, deleteDoc, doc, Timestamp, query, orderBy, getDocs, updateDoc, where } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

// 1. Define the shape of a single scan record from the subcollection
export interface ScanData {
  id: string;
  timestamp: Timestamp;
}

// 2. Define the main QRData interface
export interface QRData {
  id: string;
  content: string;
  type: string;
  title: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  scans: number;
  qrCodeDataUrl?: string;
  destinationUrl: string;
  userId: string; // Added userId field
  scanHistory?: ScanData[];
}

// 3. Define the context type to include all functions
interface QRContextType {
  qrCodes: QRData[];
  addQR: (qrData: Omit<QRData, 'id' | 'createdAt' | 'scans' | 'scanHistory' | 'updatedAt' | 'userId'>) => Promise<QRData | null>;
  deleteQR: (qrId: string) => void;
  fetchScanHistory: (qrId: string) => Promise<ScanData[]>;
  updateQRDestination: (qrId: string, newDestinationUrl: string) => Promise<void>;
}

const QRContext = createContext<QRContextType | undefined>(undefined);

export const QRProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [qrCodes, setQrCodes] = useState<QRData[]>([]);

  // Real-time listener for the main QR code list filtered by user
  useEffect(() => {
    if (!user) {
      setQrCodes([]);
      return;
    }

    const q = query(
      collection(db, 'qrCodes'), 
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const codesFromDb: QRData[] = [];
      querySnapshot.forEach((doc) => {
        codesFromDb.push({ id: doc.id, ...doc.data() } as QRData);
      });
      setQrCodes(codesFromDb);
    }, (error) => {
      console.error("Error with Firestore snapshot listener:", error);
      toast.error("Failed to sync QR codes from the database.");
    });
    return () => unsubscribe();
  }, [user]);

  const addQR = useCallback(async (qrData: Omit<QRData, 'id' | 'createdAt' | 'scans' | 'scanHistory' | 'updatedAt' | 'userId'>): Promise<QRData | null> => {
    if (!user) {
      toast.error("You must be signed in to create QR codes.");
      return null;
    }

    try {
      const docData = {
        ...qrData,
        scans: 0,
        userId: user.uid,
        createdAt: Timestamp.now(),
      };
      const docRef = await addDoc(collection(db, "qrCodes"), docData);
      toast.success('QR code saved to database!');
      return { id: docRef.id, ...docData };
    } catch (e) {
      console.error("Error adding document: ", e);
      toast.error("Failed to save QR code.");
      return null;
    }
  }, [user]);

  const deleteQR = useCallback(async (qrId: string) => {
    if (!user) {
      toast.error("You must be signed in to delete QR codes.");
      return;
    }

    try {
      await deleteDoc(doc(db, "qrCodes", qrId));
      toast.success('QR code deleted!');
    } catch (e) {
      console.error("Error deleting document: ", e);
      toast.error("Failed to delete QR code.");
    }
  }, [user]);

  const fetchScanHistory = useCallback(async (qrId: string): Promise<ScanData[]> => {
    try {
      const historyCollectionRef = collection(db, 'qrCodes', qrId, 'scans');
      const q = query(historyCollectionRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const history: ScanData[] = [];
      querySnapshot.forEach((doc) => {
        history.push({ id: doc.id, ...doc.data() } as ScanData);
      });
      return history;
    } catch (error) {
      console.error("Error fetching scan history:", error);
      toast.error("Could not load scan details.");
      return [];
    }
  }, []);
  
  const updateQRDestination = useCallback(async (qrId: string, newDestinationUrl: string): Promise<void> => {
    if (!user) {
      toast.error("You must be signed in to update QR codes.");
      throw new Error("User not authenticated");
    }

    if (!newDestinationUrl || !newDestinationUrl.startsWith('http')) {
      toast.error("Please provide a valid destination URL (e.g., https://example.com)");
      throw new Error("Invalid URL provided");
    }

    try {
      const qrDocRef = doc(db, 'qrCodes', qrId);
      await updateDoc(qrDocRef, {
        destinationUrl: newDestinationUrl,
        content: newDestinationUrl,
        updatedAt: Timestamp.now(),
      });
      toast.success("QR code destination updated successfully!");
    } catch (error) {
      console.error("Error updating QR code destination:", error);
      toast.error("Failed to update destination. Please try again.");
      throw error;
    }
  }, [user]);

  const value = { qrCodes, addQR, deleteQR, fetchScanHistory, updateQRDestination };

  return <QRContext.Provider value={value}>{children}</QRContext.Provider>;
};

export const useQR = () => {
  const context = useContext(QRContext);
  if (context === undefined) {
    throw new Error('useQR must be used within a QRProvider');
  }
  return context;
};