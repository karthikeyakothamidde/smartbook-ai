import { Router, Response } from 'express';
import { PrismaClient, Appointment } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/authMiddleware';
import { AIService } from '../services/aiService';

const router = Router();
const prisma = new PrismaClient();

// Get Appointments (Filtered by role permissions)
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { role, id: userId } = req.user;

  try {
    let appointments;

    if (role === 'ADMIN') {
      appointments = await prisma.appointment.findMany({
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          employee: { include: { user: { select: { name: true } } } },
          service: true,
          payment: true,
          review: true
        },
        orderBy: { startTime: 'asc' }
      });
    } else if (role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { userId } });
      if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

      appointments = await prisma.appointment.findMany({
        where: { employeeId: employee.id },
        include: {
          customer: { select: { id: true, name: true, email: true, phone: true } },
          service: true,
          payment: true,
          review: true
        },
        orderBy: { startTime: 'asc' }
      });
    } else {
      // CUSTOMER
      appointments = await prisma.appointment.findMany({
        where: { customerId: userId },
        include: {
          employee: { include: { user: { select: { name: true } } } },
          service: true,
          payment: true,
          review: true
        },
        orderBy: { startTime: 'asc' }
      });
    }

    return res.json(appointments);
  } catch (error) {
    console.error("Fetch appointments error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Available Time Slots for a service/employee on a date
router.get('/available-slots', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { serviceId, employeeId, date } = req.query;

  if (!serviceId || !date) {
    return res.status(400).json({ message: 'serviceId and date are required' });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    // Ensure date is evaluated correctly in timezone
    const dateStr = date as string; // "YYYY-MM-DD"
    const targetDate = new Date(`${dateStr}T00:00:00`);
    const dayOfWeek = targetDate.getDay(); // 0-6

    // Find eligible employees
    let employees;
    if (employeeId && employeeId !== 'undefined' && employeeId !== '') {
      employees = await prisma.employee.findMany({
        where: { id: employeeId as string, active: true },
        include: { availability: true }
      });
    } else {
      employees = await prisma.employee.findMany({
        where: { skills: { contains: service.category }, active: true },
        include: { availability: true }
      });
    }

    const possibleSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
    const availableSlots: string[] = [];

    // Check each possible slot
    for (const slotStr of possibleSlots) {
      const [slotH, slotM] = slotStr.split(':').map(Number);
      const slotStart = new Date(targetDate);
      slotStart.setHours(slotH, slotM, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + service.duration * 60 * 1000);

      let slotIsFree = false;

      for (const emp of employees) {
        // Check if employee works on this day
        const avail = emp.availability.find(a => a.dayOfWeek === dayOfWeek && !a.isClosed);
        if (!avail) continue;

        // Check if employee is on approved leave on this day
        const onLeave = await prisma.leave.findFirst({
          where: {
            employeeId: emp.id,
            date: dateStr,
            status: 'APPROVED'
          }
        });
        if (onLeave) continue;

        // Check if slot falls within working hours
        const [wStartH, wStartM] = avail.startTime.split(':').map(Number);
        const [wEndH, wEndM] = avail.endTime.split(':').map(Number);
        const workStart = new Date(targetDate);
        workStart.setHours(wStartH, wStartM, 0, 0);
        const workEnd = new Date(targetDate);
        workEnd.setHours(wEndH, wEndM, 0, 0);

        if (slotStart < workStart || slotEnd > workEnd) continue;

        // Check overlapping appointments for this employee
        const overlap = await prisma.appointment.findFirst({
          where: {
            employeeId: emp.id,
            status: { notIn: ['CANCELLED'] },
            OR: [
              { startTime: { lt: slotEnd }, endTime: { gt: slotStart } }
            ]
          }
        });

        if (!overlap) {
          slotIsFree = true;
          break; // Found at least one free employee for this slot!
        }
      }

      if (slotIsFree) {
        availableSlots.push(slotStr);
      }
    }

    return res.json(availableSlots);
  } catch (error) {
    console.error("Fetch slots error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Book an appointment (Regular booking or via AI recommendation confirmation)
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  const { serviceId, employeeId, startTime, notes } = req.body;
  const customerId = req.user.id;

  if (!serviceId || !startTime) {
    return res.status(400).json({ message: 'Service and start time are required' });
  }

  try {
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(404).json({ message: 'Service not found' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + service.duration * 60 * 1000);

    // 1. Staff Allocation & Check Double Booking
    let assignedEmployeeId = employeeId;
    
    if (!assignedEmployeeId) {
      // Find all employees matching this service category
      const availableEmployees = await prisma.employee.findMany({
        where: {
          skills: { contains: service.category },
          active: true
        }
      });

      // Filter employees to those who don't have overlapping appointments
      const freeEmployeeIds: string[] = [];
      for (const emp of availableEmployees) {
        const overlap = await prisma.appointment.findFirst({
          where: {
            employeeId: emp.id,
            status: { notIn: ['CANCELLED'] },
            OR: [
              { startTime: { lt: end }, endTime: { gt: start } }
            ]
          }
        });
        if (!overlap) freeEmployeeIds.push(emp.id);
      }

      if (freeEmployeeIds.length === 0) {
        return res.status(409).json({ 
          message: 'No staff available for the selected slot.', 
          suggestWaitlist: true 
        });
      }

      // Allocate the best staff based on workload, ratings, experience
      const bestEmpId = await AIService.allocateBestEmployee(service.category, start, freeEmployeeIds);
      if (!bestEmpId) {
        return res.status(500).json({ message: 'Failed to allocate staff.' });
      }
      assignedEmployeeId = bestEmpId;
    } else {
      // Check specific employee availability
      const overlap = await prisma.appointment.findFirst({
        where: {
          employeeId: assignedEmployeeId,
          status: { notIn: ['CANCELLED'] },
          OR: [
            { startTime: { lt: end }, endTime: { gt: start } }
          ]
        }
      });

      if (overlap) {
        return res.status(409).json({ 
          message: 'Selected staff member has a scheduling conflict.', 
          suggestWaitlist: true 
        });
      }
    }

    // 2. Predict No-Show Risk
    const now = new Date();
    const leadTimeHours = Math.max(0, (start.getTime() - now.getTime()) / (1000 * 60 * 60));
    const prediction = await AIService.predictNoShowRisk(customerId, start, leadTimeHours);

    // 3. Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        customerId,
        employeeId: assignedEmployeeId,
        serviceId,
        startTime: start,
        endTime: end,
        status: 'CONFIRMED',
        noShowRisk: prediction.risk,
        noShowProbability: prediction.probability,
        notes,
        pricePaid: 0.0,
        paymentStatus: 'PENDING'
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        service: true
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: customerId,
        title: 'Appointment Booked',
        message: `Your booking for ${service.name} with ${appointment.employee.user.name} is confirmed for ${start.toLocaleString()}.`,
        type: 'BOOKING'
      }
    });

    return res.status(201).json(appointment);
  } catch (error: any) {
    console.error("Booking error:", error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// AI Parse Natural Language Query & Suggest Slots
router.post('/ai-parse', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Prompt text is required' });

  try {
    // 1. Parse natural language request into details
    const parsed = await AIService.parseNaturalLanguageBooking(prompt);
    
    // 2. Query DB to match a service
    const service = await prisma.service.findFirst({
      where: {
        OR: [
          { name: { contains: parsed.serviceNameOrCategory } },
          { category: { contains: parsed.serviceNameOrCategory } }
        ],
        active: true
      }
    });

    if (!service) {
      return res.status(404).json({
        message: `Could not identify a matching service for category "${parsed.serviceNameOrCategory}".`,
        parsed
      });
    }

    // 3. Retrieve eligible employees
    let employees = await prisma.employee.findMany({
      where: {
        skills: { contains: service.category },
        active: true
      },
      include: {
        user: { select: { name: true } },
        availability: true
      }
    });

    // Filter by name if preferred employee was specified
    if (parsed.preferredEmployeeName) {
      const filtered = employees.filter(emp => 
        emp.user.name.toLowerCase().includes(parsed.preferredEmployeeName!.toLowerCase())
      );
      if (filtered.length > 0) employees = filtered;
    }

    if (employees.length === 0) {
      return res.status(404).json({ message: 'No employees available for this service category.', service });
    }

    // 4. Generate potential candidate slots on the preferred date
    // We will scan the preferred date between the parsed preferred time start and end.
    const slots: Array<{
      startTime: Date;
      endTime: Date;
      employeeId: string;
      employeeName: string;
      serviceId: string;
      serviceName: string;
      price: number;
    }> = [];

    const dateStr = parsed.preferredDate.toISOString().split('T')[0]; // "YYYY-MM-DD"
    const targetDayOfWeek = parsed.preferredDate.getDay(); // 0-6

    // Iterate through employees and check their schedule
    for (const emp of employees) {
      // Find employee working hours for this day of week
      const avail = emp.availability.find(a => a.dayOfWeek === targetDayOfWeek && !a.isClosed);
      if (!avail) continue; // Employee doesn't work this day

      // Compute starting bounds
      const [startH, startM] = parsed.preferredTimeStart.split(':').map(Number);
      const [endH, endM] = parsed.preferredTimeEnd.split(':').map(Number);

      const [workStartH, workStartM] = avail.startTime.split(':').map(Number);
      const [workEndH, workEndM] = avail.endTime.split(':').map(Number);

      // Determine absolute boundaries in hours
      const scanStartHour = Math.max(startH, workStartH);
      const scanEndHour = Math.min(endH, workEndH);

      if (scanStartHour >= scanEndHour) continue; // No overlapping working hours

      // Generate 30-minute interval slots to check
      for (let hour = scanStartHour; hour < scanEndHour; hour++) {
        for (const minutes of [0, 30]) {
          const slotStart = new Date(parsed.preferredDate);
          slotStart.setHours(hour, minutes, 0, 0);

          const slotEnd = new Date(slotStart.getTime() + service.duration * 60 * 1000);

          // Verify if this is within employee availability end limit
          const maxWorkingEnd = new Date(parsed.preferredDate);
          maxWorkingEnd.setHours(workEndH, workEndM, 0, 0);
          if (slotEnd > maxWorkingEnd) continue;

          // Check if employee has overlapping bookings
          const conflict = await prisma.appointment.findFirst({
            where: {
              employeeId: emp.id,
              status: { notIn: ['CANCELLED'] },
              OR: [
                { startTime: { lt: slotEnd }, endTime: { gt: slotStart } }
              ]
            }
          });

          if (!conflict) {
            slots.push({
              startTime: slotStart,
              endTime: slotEnd,
              employeeId: emp.id,
              employeeName: emp.user.name,
              serviceId: service.id,
              serviceName: service.name,
              price: service.price
            });
            if (slots.length >= 4) break; // Limit suggestions to top 4 options
          }
        }
        if (slots.length >= 4) break;
      }
      if (slots.length >= 4) break;
    }

    return res.json({
      message: slots.length > 0 ? "Slots found!" : "No free slots found matching criteria.",
      parsed,
      service,
      suggestedSlots: slots
    });
  } catch (error: any) {
    console.error("AI parse route error:", error);
    return res.status(500).json({ message: 'Internal AI parsing error', error: error.message });
  }
});

// Drag-and-drop Reschedule API
router.put('/:id/reschedule', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { startTime } = req.body; // new ISO start time
  if (!startTime) return res.status(400).json({ message: 'New start time is required' });

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const start = new Date(startTime);
    const end = new Date(start.getTime() + appointment.service.duration * 60 * 1000);

    // Double booking check for employee (excluding current appointment)
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        employeeId: appointment.employeeId,
        status: { notIn: ['CANCELLED'] },
        OR: [
          { startTime: { lt: end }, endTime: { gt: start } }
        ]
      }
    });

    if (conflict) {
      return res.status(409).json({ message: 'Staff has a booking conflict at the selected time.' });
    }

    // Recalculate No-show risk
    const now = new Date();
    const leadHours = Math.max(0, (start.getTime() - now.getTime()) / (1000 * 60 * 60));
    const prediction = await AIService.predictNoShowRisk(appointment.customerId, start, leadHours);

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        startTime: start,
        endTime: end,
        noShowRisk: prediction.risk,
        noShowProbability: prediction.probability
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        service: true
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: appointment.customerId,
        title: 'Appointment Rescheduled',
        message: `Your booking for ${appointment.service.name} has been rescheduled to ${start.toLocaleString()}.`,
        type: 'BOOKING'
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Reschedule error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Cancel Appointment and trigger Auto Waitlist Promotion
router.post('/:id/cancel', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { service: true, employee: { include: { user: { select: { name: true } } } } }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Update appointment status to CANCELLED
    const cancelledApp = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });

    // Send Cancellation Notification
    await prisma.notification.create({
      data: {
        userId: appointment.customerId,
        title: 'Appointment Cancelled',
        message: `Your booking for ${appointment.service.name} with ${appointment.employee.user.name} has been cancelled.`,
        type: 'BOOKING'
      }
    });

    // --- AUTOMATIC WAITLIST PROMOTION SYSTEM ---
    const dateStr = appointment.startTime.toISOString().split('T')[0];
    
    // Find customers waiting for this service on this specific date
    const waitlisted = await prisma.waitlist.findFirst({
      where: {
        serviceId: appointment.serviceId,
        preferredDate: dateStr,
        status: 'WAITING'
      },
      orderBy: { createdAt: 'asc' }, // FIFO
      include: { customer: true }
    });

    if (waitlisted) {
      // Check if slot overlaps with waitlisted customer's preferred hours
      // Simple implementation: automatically promote them to this slot
      const start = appointment.startTime;
      const end = appointment.endTime;

      // Predict no-show risk for waitlisted customer
      const now = new Date();
      const leadHours = Math.max(0, (start.getTime() - now.getTime()) / (1000 * 60 * 60));
      const prediction = await AIService.predictNoShowRisk(waitlisted.customerId, start, leadHours);

      // Create new appointment for the promoted user
      const newApp = await prisma.appointment.create({
        data: {
          customerId: waitlisted.customerId,
          employeeId: appointment.employeeId,
          serviceId: appointment.serviceId,
          startTime: start,
          endTime: end,
          status: 'CONFIRMED',
          noShowRisk: prediction.risk,
          noShowProbability: prediction.probability,
          notes: `Auto-promoted from Waitlist. (Request: ${waitlisted.preferredTimeRange})`,
          pricePaid: 0.0,
          paymentStatus: 'PENDING'
        }
      });

      // Update waitlist entry status
      await prisma.waitlist.update({
        where: { id: waitlisted.id },
        data: { status: 'PROMOTED' }
      });

      // Notify the promoted customer
      await prisma.notification.create({
        data: {
          userId: waitlisted.customerId,
          title: 'Waitlist Promotion!',
          message: `Great news! A slot opened up. You have been promoted and booked for ${appointment.service.name} on ${start.toLocaleString()}!`,
          type: 'WAITLIST'
        }
      });

      console.log(`Waitlisted customer ${waitlisted.customer.name} promoted to appointment ${newApp.id}`);
    }

    return res.json({ message: 'Appointment cancelled successfully', appointment: cancelledApp });
  } catch (error) {
    console.error("Cancellation error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Waitlist API: Join Waitlist
router.post('/waitlist', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  const { serviceId, preferredDate, preferredTimeRange } = req.body;

  if (!serviceId || !preferredDate) {
    return res.status(400).json({ message: 'Service ID and preferred date are required.' });
  }

  try {
    const entry = await prisma.waitlist.create({
      data: {
        customerId: req.user.id,
        serviceId,
        preferredDate,
        preferredTimeRange: preferredTimeRange || 'ANYTIME',
        status: 'WAITING'
      },
      include: { service: true }
    });

    await prisma.notification.create({
      data: {
        userId: req.user.id,
        title: 'Joined Waitlist',
        message: `You joined the waitlist for ${entry.service.name} on ${preferredDate}. We will notify you if a slot opens.`,
        type: 'WAITLIST'
      }
    });

    return res.status(201).json(entry);
  } catch (error) {
    console.error("Waitlist error:", error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get Waitlist for user or admin
router.get('/waitlist', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    let entries;
    if (req.user.role === 'ADMIN') {
      entries = await prisma.waitlist.findMany({
        include: {
          customer: { select: { name: true, email: true } },
          service: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      entries = await prisma.waitlist.findMany({
        where: { customerId: req.user.id },
        include: { service: true },
        orderBy: { createdAt: 'desc' }
      });
    }

    return res.json(entries);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Update Appointment Status (Admin only)
router.put('/:id/status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user || req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Forbidden' });
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  try {
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: status || undefined,
        paymentStatus: paymentStatus || undefined
      },
      include: {
        customer: { select: { id: true, name: true, email: true, phone: true } },
        employee: { include: { user: { select: { name: true } } } },
        service: true
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error("Update status error:", error);
    return res.status(500).json({ message: 'Failed to update appointment status' });
  }
});

export default router;
