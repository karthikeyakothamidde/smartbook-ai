import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get list of active employees
router.get('/', async (req: any, res: Response) => {
  try {
    const employees = await prisma.employee.findMany({
      where: { active: true },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        availability: true
      }
    });

    // Format output
    const formatted = employees.map(emp => ({
      id: emp.id,
      userId: emp.userId,
      name: emp.user.name,
      email: emp.user.email,
      phone: emp.user.phone,
      skills: emp.skills,
      rating: emp.rating,
      experienceYears: emp.experienceYears,
      bio: emp.bio,
      availability: emp.availability
    }));

    return res.json(formatted);
  } catch (error) {
    console.error("Fetch employees error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get individual employee
router.get('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { name: true, email: true, phone: true }
        },
        availability: true,
        leaves: true
      }
    });

    if (!emp) return res.status(404).json({ message: 'Employee profile not found' });

    return res.json({
      id: emp.id,
      name: emp.user.name,
      email: emp.user.email,
      phone: emp.user.phone,
      skills: emp.skills,
      rating: emp.rating,
      experienceYears: emp.experienceYears,
      bio: emp.bio,
      availability: emp.availability,
      leaves: emp.leaves
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee: Get current employee working schedule
router.get('/me/schedule', authenticateToken, requireRole(['EMPLOYEE']), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id },
      include: {
        availability: true,
        leaves: true
      }
    });

    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    return res.json({
      employeeId: employee.id,
      availability: employee.availability,
      leaves: employee.leaves
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee: Update working hours/availability
router.put('/me/schedule', authenticateToken, requireRole(['EMPLOYEE']), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { availability } = req.body; // Array of { dayOfWeek: number, startTime: string, endTime: string, isClosed: boolean }

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    // Delete existing availability
    await prisma.availability.deleteMany({
      where: { employeeId: employee.id }
    });

    // Create new availability records
    const created = await prisma.availability.createMany({
      data: availability.map((item: any) => ({
        employeeId: employee.id,
        dayOfWeek: item.dayOfWeek,
        startTime: item.startTime,
        endTime: item.endTime,
        isClosed: item.isClosed ?? false
      }))
    });

    return res.json({ message: 'Availability schedule updated', count: created.count });
  } catch (error) {
    console.error("Update availability error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Employee: Request / File leave time-off
router.post('/me/leave', authenticateToken, requireRole(['EMPLOYEE']), async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { date, reason } = req.body; // date: "YYYY-MM-DD"

  if (!date) return res.status(400).json({ message: 'Leave date is required' });

  try {
    const employee = await prisma.employee.findUnique({
      where: { userId: req.user.id }
    });

    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const leave = await prisma.leave.create({
      data: {
        employeeId: employee.id,
        date,
        reason: reason || ''
      }
    });

    return res.status(201).json({ message: 'Leave recorded successfully', leave });
  } catch (error) {
    console.error("Record leave error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
