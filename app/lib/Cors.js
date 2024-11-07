// lib/cors.js
import Cors from 'cors';

// Initialize CORS middleware with more secure settings
const cors = Cors({
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Supported HTTP methods
  origin: 'http://localhost:5173', // Allow only requests from this origin (your frontend)
  allowedHeaders: ['Content-Type'], // Accept only Content-Type headers
  credentials: true, // Allow cookies if needed (can be omitted if not required)
});

// Helper function to handle CORS middleware
export const runCors = (req, res, next) => {
  cors(req, res, (result) => {
    if (result instanceof Error) {
      return res.status(500).json({ message: 'CORS Error' });
    }
    next(); // Proceed to the next middleware (signup logic)
  });
};
