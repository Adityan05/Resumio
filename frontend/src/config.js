// API Configuration
// These values are replaced at build time by Vite based on environment variables

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const OCR_URL = import.meta.env.VITE_OCR_URL || "http://localhost:8000";
