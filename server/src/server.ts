import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth';
import appointmentRoutes from './routes/appointments';
import employeeRoutes from './routes/employees';
import serviceRoutes from './routes/services';
import analyticsRoutes from './routes/analytics';
import notificationRoutes from './routes/notifications';
import paymentRoutes from './routes/payments';
import reviewRoutes from './routes/reviews';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for hackathon simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes Mount
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'SmartBook AI Backend is healthy' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`SmartBook AI Backend server running on http://localhost:${PORT}`);
});
