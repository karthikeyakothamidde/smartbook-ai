import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get all active services
router.get('/', async (req: any, res: Response) => {
  try {
    const services = await prisma.service.findMany({
      where: { active: true }
    });
    return res.json(services);
  } catch (error) {
    console.error("Fetch services error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get a single service
router.get('/:id', async (req: any, res: Response) => {
  const { id } = req.params;
  try {
    const service = await prisma.service.findUnique({
      where: { id }
    });
    if (!service) return res.status(404).json({ message: 'Service not found' });
    return res.json(service);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Create service
router.post('/', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { name, duration, price, category, description } = req.body;

  if (!name || !duration || !price || !category) {
    return res.status(400).json({ message: 'Missing fields: name, duration, price, category' });
  }

  try {
    const service = await prisma.service.create({
      data: {
        name,
        duration: parseInt(duration),
        price: parseFloat(price),
        category,
        description: description || ''
      }
    });
    return res.status(201).json(service);
  } catch (error) {
    console.error("Create service error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Update service
router.put('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, duration, price, category, description, active } = req.body;

  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        duration: duration ? parseInt(duration) : undefined,
        price: price ? parseFloat(price) : undefined,
        category,
        description,
        active
      }
    });
    return res.json(service);
  } catch (error) {
    console.error("Update service error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Delete service (soft delete by marking active = false)
router.delete('/:id', authenticateToken, requireRole(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const service = await prisma.service.update({
      where: { id },
      data: { active: false }
    });
    return res.json({ message: 'Service deleted successfully', service });
  } catch (error) {
    console.error("Delete service error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
