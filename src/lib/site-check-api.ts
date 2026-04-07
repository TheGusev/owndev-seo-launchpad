/**
 * Backward-compatible re-export from the unified API layer.
 * All consumers of this file continue to work without changes.
 */
export { getFullScan, startScan, getScanStatus, getScanPreview, createReport, getReport } from './api/scan';
