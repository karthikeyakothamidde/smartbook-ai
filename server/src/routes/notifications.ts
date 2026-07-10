import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get current user's notifications
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(notifications);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all as read
router.put('/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark single notification as read
router.put('/:id/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const updated = await prisma.notification.update({
      where: { id, userId: req.user.id },
      data: { isRead: true }
    });
    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
