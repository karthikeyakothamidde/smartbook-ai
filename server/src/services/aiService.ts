import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ParsedBooking {
  serviceNameOrCategory: string;
  preferredDate: Date;
  preferredTimeStart: string; // e.g. "17:00"
  preferredTimeEnd: string;   // e.g. "20:00"
  preferredEmployeeName?: string;
  error?: string;
}

export class AIService {
  /**
   * Parse natural language requests for appointment slot matching.
   * Utilizes local rules & regex parsing by default. Can extend to OpenAI if configured.
   */
  static async parseNaturalLanguageBooking(text: string, referenceDate: Date = new Date()): Promise<ParsedBooking> {
    const prompt = text.toLowerCase();
    
    // Check if OpenAI key is present and would like to use it (optional advanced flow)
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await this.queryOpenAIForBooking(prompt, referenceDate);
        if (response) return response;
      } catch (err) {
        console.error("OpenAI parsing failed, falling back to local NLP parser:", err);
      }
    }

    // --- LOCAL NLP PARSING ENGINE ---
    // 1. Identify Service Category or keyword
    let serviceNameOrCategory = "general";
    if (prompt.includes("dentist") || prompt.includes("dental") || prompt.includes("tooth") || prompt.includes("teeth")) {
      serviceNameOrCategory = "Dental";
    } else if (prompt.includes("hair") || prompt.includes("cut") || prompt.includes("salon") || prompt.includes("trim") || prompt.includes("barber")) {
      serviceNameOrCategory = "Salon";
    } else if (prompt.includes("consult") || prompt.includes("advice") || prompt.includes("meeting") || prompt.includes("legal") || prompt.includes("business")) {
      serviceNameOrCategory = "Consulting";
    } else if (prompt.includes("massage") || prompt.includes("spa") || prompt.includes("therapy") || prompt.includes("wellness")) {
      serviceNameOrCategory = "Wellness";
    }

    // 2. Parse Date
    let bookingDate = new Date(referenceDate);
    bookingDate.setHours(0, 0, 0, 0);

    const daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    let dayOffset = -1;

    // Check for days of week
    for (let i = 0; i < 7; i++) {
      if (prompt.includes(daysOfWeek[i])) {
        const currentDay = referenceDate.getDay();
        const targetDay = i;
        
        // Calculate offset
        dayOffset = targetDay - currentDay;
        if (dayOffset <= 0) {
          dayOffset += 7; // Next week's day
        }
        
        // Handle "next Tuesday" vs "this Tuesday" (if next is explicitly typed, add another week)
        if (prompt.includes("next " + daysOfWeek[i])) {
          // If already added 7 because targetDay <= currentDay, and they said "next", we might want it to be 7 or 14.
          // Let's ensure it's next week's day. If dayOffset was positive (e.g. today is Monday, target is Tuesday, dayOffset is 1),
          // saying "next Tuesday" means next week's Tuesday, so we add 7.
          if (targetDay > currentDay) {
            dayOffset += 7;
          }
        }
        break;
      }
    }

    if (dayOffset !== -1) {
      bookingDate.setDate(bookingDate.getDate() + dayOffset);
    } else if (prompt.includes("tomorrow")) {
      bookingDate.setDate(bookingDate.getDate() + 1);
    } else if (prompt.includes("today")) {
      // Keep today
    } else if (prompt.includes("day after tomorrow")) {
      bookingDate.setDate(bookingDate.getDate() + 2);
    } else {
      // Default to tomorrow if not specified
      bookingDate.setDate(bookingDate.getDate() + 1);
    }

    // 3. Parse Time range
    let preferredTimeStart = "09:00";
    let preferredTimeEnd = "17:00";

    // Standard hours slots
    if (prompt.includes("morning")) {
      preferredTimeStart = "09:00";
      preferredTimeEnd = "12:00";
    } else if (prompt.includes("afternoon")) {
      preferredTimeStart = "12:00";
      preferredTimeEnd = "17:00";
    } else if (prompt.includes("evening") || prompt.includes("night")) {
      preferredTimeStart = "17:00";
      preferredTimeEnd = "20:00";
    }

    // Check for specific numbers, e.g. "after 5 pm", "at 3 pm", "before 11 am"
    const hourRegex = /(after|before|at|around)?\s*(\d{1,2})\s*(pm|am)?/g;
    let match;
    while ((match = hourRegex.exec(prompt)) !== null) {
      const preposition = match[1]; // after, before, at
      let hour = parseInt(match[2]);
      const ampm = match[3];

      if (ampm === "pm" && hour < 12) {
        hour += 12;
      } else if (ampm === "am" && hour === 12) {
        hour = 0;
      } else if (!ampm) {
        // Assume pm if standard working hour number is low, e.g., "after 5" usually means 5pm (17:00)
        if (hour < 8) {
          hour += 12;
        }
      }

      const hourString = hour.toString().padStart(2, "0") + ":00";

      if (preposition === "after") {
        preferredTimeStart = hourString;
        preferredTimeEnd = "20:00";
      } else if (preposition === "before") {
        preferredTimeStart = "08:00";
        preferredTimeEnd = hourString;
      } else if (preposition === "at" || preposition === "around" || !preposition) {
        preferredTimeStart = hourString;
        // Window of 1 hour for specific appointment time matches
        const endHour = Math.min(hour + 1, 21);
        preferredTimeEnd = endHour.toString().padStart(2, "0") + ":00";
      }
    }

    // 4. Parse Preferred Employee Name
    let preferredEmployeeName: string | undefined = undefined;
    const doctors = ["sarah", "john", "emily", "david", "alex", "jessica", "michael"];
    for (const doc of doctors) {
      if (prompt.includes(doc)) {
        preferredEmployeeName = doc;
        break;
      }
    }

    return {
      serviceNameOrCategory,
      preferredDate: bookingDate,
      preferredTimeStart,
      preferredTimeEnd,
      preferredEmployeeName
    };
  }

  /**
   * Optional helper to fetch parsing results from OpenAI
   */
  private static async queryOpenAIForBooking(text: string, referenceDate: Date): Promise<ParsedBooking | null> {
    // Schema-based GPT parsing can go here. For the hackathon, we simulate a robust response or interface.
    return null; // Fallback to local parser by default to avoid key issues in testing
  }

  /**
   * Smart Staff Allocation Logic.
   * Scrapes database for employees having required skill, calculates score based on:
   * - Experience years (weight: 20%)
   * - Average customer rating (weight: 30%)
   * - Load balance: total appointments assigned for that day (weight: 50% - lower load gets higher score)
   */
  static async allocateBestEmployee(
    serviceCategory: string,
    bookingDate: Date,
    availableEmployeeIds: string[]
  ): Promise<string | null> {
    if (availableEmployeeIds.length === 0) return null;

    const employees = await prisma.employee.findMany({
      where: {
        id: { in: availableEmployeeIds },
        skills: { contains: serviceCategory }
      },
      include: {
        appointments: {
          where: {
            startTime: {
              gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
              lt: new Date(bookingDate.setHours(23, 59, 59, 999))
            },
            status: { not: "CANCELLED" }
          }
        }
      }
    });

    if (employees.length === 0) {
      // Fallback: If no employee has explicit category keyword in skills, grab first available employee
      const allAvailable = await prisma.employee.findMany({
        where: { id: { in: availableEmployeeIds } },
        include: {
          appointments: {
            where: {
              startTime: {
                gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
                lt: new Date(bookingDate.setHours(23, 59, 59, 999))
              },
              status: { not: "CANCELLED" }
            }
          }
        }
      });
      if (allAvailable.length === 0) return null;
      return this.rankEmployeesByLoad(allAvailable);
    }

    return this.rankEmployeesByLoad(employees);
  }

  private static rankEmployeesByLoad(employees: any[]): string {
    let bestEmployeeId = employees[0].id;
    let highestScore = -1;

    // Normalize loads (find max load to scale)
    const maxAppointments = Math.max(...employees.map(e => e.appointments.length), 1);

    for (const emp of employees) {
      // Experience Score (0 to 1) - cap at 10 years
      const expScore = Math.min(emp.experienceYears / 10, 1.0);
      
      // Rating Score (0 to 1) - cap at 5.0
      const ratingScore = emp.rating / 5.0;

      // Workload Score (0 to 1) - invert load (fewer appointments = higher score)
      const workloadScore = 1.0 - (emp.appointments.length / maxAppointments);

      // Total Weighted Score
      // 50% workload balance, 30% customer rating, 20% experience
      const totalScore = (workloadScore * 0.5) + (ratingScore * 0.3) + (expScore * 0.2);

      if (totalScore > highestScore) {
        highestScore = totalScore;
        bestEmployeeId = emp.id;
      }
    }

    return bestEmployeeId;
  }

  /**
   * AI No-Show Prediction Engine.
   * Analyzes customer profile + booking circumstances to calculate likelihood of missing appointment.
   * Outputs Risk Category ("LOW", "MEDIUM", "HIGH") and Probability Score.
   */
  static async predictNoShowRisk(
    customerId: string,
    appointmentTime: Date,
    bookingLeadTimeHours: number
  ): Promise<{ risk: string; probability: number }> {
    // 1. Fetch user's appointment history
    const userAppointments = await prisma.appointment.findMany({
      where: { customerId },
      orderBy: { startTime: 'desc' },
      take: 10
    });

    let baseProb = 0.10; // 10% baseline risk for standard customers

    if (userAppointments.length > 0) {
      const total = userAppointments.length;
      const completed = userAppointments.filter(a => a.status === "COMPLETED").length;
      const cancelled = userAppointments.filter(a => a.status === "CANCELLED").length;
      const missed = userAppointments.filter(a => a.status === "PENDING" && a.startTime < new Date()).length; // Uncompleted past appointments count as no-shows

      // Rate calculations
      const missRate = missed / total;
      const cancelRate = cancelled / total;

      // Penalize for past missed appointments (heavy weight)
      baseProb += missRate * 0.60;

      // Slightly penalize for cancellations (tells us client has fluctuating schedule)
      baseProb += cancelRate * 0.15;
    } else {
      // First-time bookers have slightly higher default risk than returning, reliable customers
      baseProb = 0.20;
    }

    // 2. Booking Lead Time Factor
    // Booking extremely last minute (< 2 hours) actually has lower no-show risk (client is already planning it now).
    // Booking months in advance has higher risk of forgetting.
    if (bookingLeadTimeHours > 168) { // > 1 week
      baseProb += 0.08;
    } else if (bookingLeadTimeHours < 4) {
      baseProb -= 0.05;
    }

    // 3. Time of Day Factor
    const hour = appointmentTime.getHours();
    if (hour < 9 || hour > 18) {
      baseProb += 0.05; // Early morning/late night slots are slightly easier to miss
    }

    // Clamp probability between 0.02 and 0.98
    const probability = Math.max(0.02, Math.min(0.98, baseProb));

    let risk = "LOW";
    if (probability > 0.60) {
      risk = "HIGH";
    } else if (probability > 0.25) {
      risk = "MEDIUM";
    }

    return { risk, probability };
  }
}
