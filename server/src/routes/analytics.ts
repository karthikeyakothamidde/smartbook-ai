import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireRole } from '../middlewares/authMiddleware';

const router = Router();
const prisma = new PrismaClient();

// Get Admin Analytics Dashboard Metrics
router.get('/', authenticateToken, requireRole(['ADMIN']), async (req: any, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      include: { service: true, employee: { include: { user: true } } }
    });

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Basic Stats
    const totalCount = appointments.length;
    const todayAppointments = appointments.filter(a => {
      const appDateStr = new Date(a.startTime).toISOString().split('T')[0];
      return appDateStr === todayStr && a.status !== 'CANCELLED';
    }).length;

    // Completed & confirmed revenue
    const revenue = appointments
      .filter(a => a.status === 'COMPLETED' || a.paymentStatus === 'PAID')
      .reduce((sum, a) => sum + a.service.price, 0);

    const cancelledCount = appointments.filter(a => a.status === 'CANCELLED').length;
    const cancellationRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;

    // A past PENDING appointment is considered a no-show
    const noShowCount = appointments.filter(a => a.status === 'PENDING' && new Date(a.startTime) < now).length;
    const noShowRate = totalCount > 0 ? (noShowCount / totalCount) * 100 : 0;

    // 2. Employee Utilization
    // Let's assume standard working day is 8 hours. 
    // Utilization = (Total booked service minutes) / (Active employees * 8 * 60)
    const employeesCount = await prisma.employee.count({ where: { active: true } });
    const totalBookedMinutes = appointments
      .filter(a => a.status !== 'CANCELLED')
      .reduce((sum, a) => sum + a.service.duration, 0);
    
    // Utilization rate calculation (simulated over a 30-day window or overall)
    const totalWorkingMinutesPossible = Math.max(employeesCount, 1) * 8 * 60 * 20; // 20 working days
    const employeeUtilization = Math.min(100, Math.max(15, (totalBookedMinutes / totalWorkingMinutesPossible) * 100));

    // 3. Peak Booking Hours
    // Create an hourly distribution from existing appointments
    const hourlyCounts: { [key: number]: number } = {};
    for (let h = 9; h <= 18; h++) hourlyCounts[h] = 0; // standard working hours

    appointments.forEach(a => {
      const hour = new Date(a.startTime).getHours();
      if (hour >= 9 && hour <= 18) {
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }
    });

    const peakBookingHours = Object.keys(hourlyCounts).map(hour => ({
      hour: `${hour}:00`,
      bookings: hourlyCounts[parseInt(hour)]
    }));

    // 4. Monthly Revenue & Appointments Chart (Simulated 6-month aggregate)
    // We group by month.
    const monthlyDataMap: { [month: string]: { revenue: number; appointments: number } } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Seed the past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      monthlyDataMap[mName] = { revenue: 0, appointments: 0 };
    }

    appointments.forEach(a => {
      const aDate = new Date(a.startTime);
      const mName = months[aDate.getMonth()];
      if (monthlyDataMap[mName] !== undefined) {
        monthlyDataMap[mName].appointments += 1;
        if (a.status === 'COMPLETED' || a.paymentStatus === 'PAID') {
          monthlyDataMap[mName].revenue += a.service.price;
        }
      }
    });

    const monthlyRevenueGraph = Object.keys(monthlyDataMap).map(month => ({
      month,
      revenue: monthlyDataMap[month].revenue,
      appointments: monthlyDataMap[month].appointments
    }));

    // 5. Popular Services Categories
    const serviceCounts: { [cat: string]: number } = {};
    appointments.forEach(a => {
      const cat = a.service.category;
      serviceCounts[cat] = (serviceCounts[cat] || 0) + 1;
    });
    const popularServices = Object.keys(serviceCounts).map(category => ({
      category,
      bookings: serviceCounts[category]
    }));

    // 6. Employee Productivity Rating
    const employees = await prisma.employee.findMany({
      include: {
        user: { select: { name: true } },
        appointments: {
          include: { service: true }
        }
      }
    });

    const employeeProductivity = employees.map(emp => {
      const completed = emp.appointments.filter(a => a.status === 'COMPLETED').length;
      const rating = emp.rating;
      return {
        name: emp.user.name,
        completedAppointments: completed,
        rating
      };
    });

    return res.json({
      summary: {
        todayAppointments,
        revenue,
        noShows: noShowCount,
        noShowRate: parseFloat(noShowRate.toFixed(1)),
        cancellationRate: parseFloat(cancellationRate.toFixed(1)),
        employeeUtilization: parseFloat(employeeUtilization.toFixed(1))
      },
      peakBookingHours,
      monthlyRevenueGraph,
      popularServices,
      employeeProductivity
    });
  } catch (error) {
    console.error("Fetch analytics error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
