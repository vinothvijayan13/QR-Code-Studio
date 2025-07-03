import * as logger from "firebase-functions/logger";
import {onRequest} from "firebase-functions/v2/https";
import {initializeApp} from "firebase-admin/app";
import * as admin from "firebase-admin/firestore";

initializeApp();
const db = admin.getFirestore();

export const track = onRequest(async (request, response) => {
  const pathParts = request.path.split("/");
  const qrId = pathParts[1];

  if (!qrId) {
    logger.error("QR Code ID is missing from the URL.", {path: request.path});
    response.status(400).send("QR Code ID is missing");
    return;
  }

  // New Log: Confirming the function started
  logger.info(`[BEGIN] Processing scan for QR ID: ${qrId}`);

  try {
    const qrDocRef = db.collection("qrCodes").doc(qrId);
    const scanHistoryRef = qrDocRef.collection("scans");

    // Step A: Add a new document to the subcollection
    await scanHistoryRef.add({
      timestamp: admin.FieldValue.serverTimestamp(),
    });
    // New Log: Confirming subcollection write
    logger.info(`[SUCCESS] Added scan record for ${qrId}`);

    // Step B: Increment the main counter
    await qrDocRef.update({
      scans: admin.FieldValue.increment(1),
    });
    // New Log: Confirming counter update
    logger.info(`[SUCCESS] Incremented scan counter for ${qrId}`);

    // Step C: Get the document for redirection
    const qrDoc = await qrDocRef.get();
    if (!qrDoc.exists) {
      logger.error(`QR Code not found after update for ID: ${qrId}`);
      response.status(404).send("QR Code not found");
      return;
    }

    const destinationUrl = qrDoc.data()?.destinationUrl;
    if (!destinationUrl) {
      logger.error(`Destination URL not found for QR ID: ${qrId}`);
      response.status(404).send("Destination URL not found");
      return;
    }

    // Final Log: Confirming redirect
    logger.info(`[END] Redirecting ${qrId} to ${destinationUrl}`);
    response.redirect(307, destinationUrl);
    
  } catch (error) {
    logger.error(`[CRITICAL ERROR] Failed during scan tracking for ${qrId}:`, error);
    response.status(500).send("An internal error occurred");
  }
});