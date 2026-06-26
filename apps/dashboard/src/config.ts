// Centralized Configuration for the React Dashboard
// API_URL will use VITE_API_URL defined in environment, or default to localhost:3000
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
