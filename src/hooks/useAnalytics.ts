
import { logEvent } from 'firebase/analytics';
import { analytics } from '@/firebase';

export const useAnalytics = () => {
  const trackQRGeneration = (qrType: string, title: string) => {
    if (analytics) {
      logEvent(analytics, 'qr_code_generated', {
        qr_type: qrType,
        qr_title: title,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackQRScan = (qrId: string, qrType: string, title: string) => {
    if (analytics) {
      logEvent(analytics, 'qr_code_scanned', {
        qr_id: qrId,
        qr_type: qrType,
        qr_title: title,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackQRDownload = (qrId: string, qrType: string, title: string) => {
    if (analytics) {
      logEvent(analytics, 'qr_code_downloaded', {
        qr_id: qrId,
        qr_type: qrType,
        qr_title: title,
        timestamp: new Date().toISOString()
      });
    }
  };

  const trackQRCopy = (qrId: string, qrType: string, title: string) => {
    if (analytics) {
      logEvent(analytics, 'qr_code_copied', {
        qr_id: qrId,
        qr_type: qrType,
        qr_title: title,
        timestamp: new Date().toISOString()
      });
    }
  };

  return {
    trackQRGeneration,
    trackQRScan,
    trackQRDownload,
    trackQRCopy
  };
};
