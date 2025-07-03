import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/firebase'; // Make sure this path is correct for your project
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // In the Pages Router, the dynamic part comes from req.query
  const { qrId } = req.query;

  // Make sure qrId is a single string
  if (typeof qrId !== 'string' || !qrId) {
    return res.status(400).send('QR Code ID is missing');
  }

  try {
    const qrDocRef = doc(db, 'qrCodes', qrId);
    
    // Increment the scan count in the database
    await updateDoc(qrDocRef, {
      scans: increment(1)
    });
    
    // Get the document to find the real destination
    const qrDoc = await getDoc(qrDocRef);

    if (!qrDoc.exists()) {
      return res.status(404).send('QR Code not found');
    }

    const destinationUrl = qrDoc.data()?.destinationUrl;
    
    if (!destinationUrl) {
      return res.status(404).send('Destination URL not found for this QR Code');
    }
    
    // Redirect the user's browser to the destination
    // 307 is a temporary redirect, which is appropriate here
    res.redirect(307, destinationUrl);

  } catch (error) {
    console.error(`Error tracking scan for ${qrId}:`, error);
    // If anything goes wrong, redirect to your app's homepage
    const fallbackUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    res.redirect(307, fallbackUrl);
  }
}