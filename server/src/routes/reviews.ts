import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Leave review for a completed appointment
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { appointmentId, rating, comment } = req.body;

  if (!appointmentId || !rating) {
    return res.status(400).json({ message: 'Appointment ID and rating are required' });
  }

  const numRating = parseInt(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { employee: true }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    
    // Ensure this customer owns the appointment
    if (appointment.customerId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to review this appointment' });
    }

    // Check if review already exists
    const existing = await prisma.review.findUnique({ where: { appointmentId } });
    if (existing) {
      return res.status(400).json({ message: 'This appointment has already been reviewed' });
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        appointmentId,
        customerId: req.user.id,
        rating: numRating,
        comment: comment || ''
      }
    });

    // --- RECALCULATE EMPLOYEE AVERAGE RATING ---
    const allEmployeeAppointments = await prisma.appointment.findMany({
      where: { employeeId: appointment.employeeId },
      select: { review: true }
    });

    const reviews = allEmployeeAppointments
      .map(app => app.review)
      .filter(rev => rev !== null) as any[];

    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      
      await prisma.employee.update({
        where: { id: appointment.employeeId },
        data: { rating: parseFloat(avg.toFixed(1)) }
      });
    }

    return res.status(201).json(review);
  } catch (error) {
    console.error("Submit review error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
