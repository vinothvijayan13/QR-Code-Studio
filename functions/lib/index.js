"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.track = void 0;
const logger = __importStar(require("firebase-functions/logger"));
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const admin = __importStar(require("firebase-admin/firestore"));
(0, app_1.initializeApp)();
const db = admin.getFirestore();
exports.track = (0, https_1.onRequest)(async (request, response) => {
    var _a;
    const pathParts = request.path.split("/");
    const qrId = pathParts[1];
    if (!qrId) {
        logger.error("QR Code ID is missing from the URL.", { path: request.path });
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
        const destinationUrl = (_a = qrDoc.data()) === null || _a === void 0 ? void 0 : _a.destinationUrl;
        if (!destinationUrl) {
            logger.error(`Destination URL not found for QR ID: ${qrId}`);
            response.status(404).send("Destination URL not found");
            return;
        }
        // Final Log: Confirming redirect
        logger.info(`[END] Redirecting ${qrId} to ${destinationUrl}`);
        response.redirect(307, destinationUrl);
    }
    catch (error) {
        logger.error(`[CRITICAL ERROR] Failed during scan tracking for ${qrId}:`, error);
        response.status(500).send("An internal error occurred");
    }
});
//# sourceMappingURL=index.js.map