import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Checkout - Simulates Razorpay order creation
router.post('/checkout', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId } = req.body;
  if (!appointmentId) return res.status(400).json({ message: 'Appointment ID is required' });

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Simulate Razorpay Order ID
    const razorpayOrderId = `order_${Math.random().toString(36).substring(2, 15)}`;

    return res.json({
      orderId: razorpayOrderId,
      amount: appointment.service.price * 100, // in paise
      currency: 'INR',
      key: 'rzp_test_mockkey12345'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Checkout error' });
  }
});

// Verify Payment - Updates appointment paymentStatus and generates invoice
router.post('/verify', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId, razorpayOrderId, razorpayPaymentId } = req.body;

  if (!appointmentId || !razorpayOrderId || !razorpayPaymentId) {
    return res.status(400).json({ message: 'Missing payment verification details' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { service: true }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Transaction to update appointment and create payment record
    const result = await prisma.$transaction(async (tx) => {
      const updatedApp = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          paymentStatus: 'PAID',
          pricePaid: appointment.service.price
        }
      });

      const payment = await tx.payment.create({
        data: {
          appointmentId,
          amount: appointment.service.price,
          currency: 'INR',
          razorpayOrderId,
          razorpayPaymentId,
          status: 'SUCCESS',
          invoiceNumber
        }
      });

      return { updatedApp, payment };
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: appointment.customerId,
        title: 'Payment Received',
        message: `Your payment of INR ${appointment.service.price} for Invoice ${invoiceNumber} was successfully processed.`,
        type: 'SYSTEM'
      }
    });

    return res.json({
      message: 'Payment verified successfully',
      invoiceNumber,
      payment: result.payment
    });
  } catch (error) {
    console.error("Payment verify error:", error);
    return res.status(500).json({ message: 'Payment verification failed' });
  }
});

// Get Invoice receipt
router.get('/invoice/:appointmentId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { appointmentId } = req.params;

  try {
    const payment = await prisma.payment.findUnique({
      where: { appointmentId },
      include: {
        appointment: {
          include: {
            customer: { select: { name: true, email: true, phone: true } },
            employee: { include: { user: { select: { name: true } } } },
            service: true
          }
        }
      }
    });

    if (!payment) return res.status(404).json({ message: 'Invoice not found' });

    return res.json({
      invoiceNumber: payment.invoiceNumber,
      date: payment.createdAt,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      customer: payment.appointment.customer,
      employee: payment.appointment.employee.user.name,
      service: {
        name: payment.appointment.service.name,
        price: payment.appointment.service.price,
        description: payment.appointment.service.description
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
