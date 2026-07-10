import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SmartBook AI database...');

  // 1. Clean Database
  await prisma.notification.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.waitlist.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.availability.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.service.deleteMany({});

  // 2. Create Services
  console.log('Creating services...');
  const dentalService1 = await prisma.service.create({
    data: {
      name: 'Dental Checkup & Cleaning',
      duration: 45,
      price: 1500,
      category: 'Dental',
      description: 'Comprehensive dental checkup, scaling, and polishing by our top specialists.'
    }
  });

  const dentalService2 = await prisma.service.create({
    data: {
      name: 'Root Canal Treatment',
      duration: 60,
      price: 4500,
      category: 'Dental',
      description: 'Advanced painless root canal procedure with high-quality crown fitting.'
    }
  });

  const salonService1 = await prisma.service.create({
    data: {
      name: 'Premium Haircut & Styling',
      duration: 30,
      price: 800,
      category: 'Salon',
      description: 'Signature haircut, wash, conditioning, and custom blow-dry styling.'
    }
  });

  const salonService2 = await prisma.service.create({
    data: {
      name: 'Global Hair Coloring',
      duration: 90,
      price: 2500,
      category: 'Salon',
      description: 'High-end ammonia-free global hair coloring with customized highlights.'
    }
  });

  const wellnessService1 = await prisma.service.create({
    data: {
      name: 'Swedish Massage Therapy',
      duration: 60,
      price: 1800,
      category: 'Wellness',
      description: 'Full body Swedish massage utilizing relaxing aromatherapy oils.'
    }
  });

  const consultingService1 = await prisma.service.create({
    data: {
      name: 'Business Strategy Session',
      duration: 45,
      price: 3000,
      category: 'Consulting',
      description: '1-on-1 strategic growth advisory session for startups and businesses.'
    }
  });

  // 3. Create Users & Roles
  console.log('Creating system users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  // Admin
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@smartbook.ai',
      password: passwordHash,
      name: 'Alex Carter (Admin)',
      role: 'ADMIN',
      phone: '+919999999999'
    }
  });

  // Default Customer
  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@smartbook.ai',
      password: passwordHash,
      name: 'Karthik Sharma (Customer)',
      role: 'CUSTOMER',
      phone: '+918888888888'
    }
  });

  // Sample Customer 2
  const customerUser2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password: passwordHash,
      name: 'Jane Doe',
      role: 'CUSTOMER',
      phone: '+917777777777'
    }
  });

  // 4. Create Employee Users & Profiles
  console.log('Creating employees...');
  const docSarahUser = await prisma.user.create({
    data: {
      email: 'sarah@smartbook.ai',
      password: passwordHash,
      name: 'Dr. Sarah Jenkins',
      role: 'EMPLOYEE',
      phone: '+919876543210'
    }
  });

  const empSarah = await prisma.employee.create({
    data: {
      userId: docSarahUser.id,
      skills: 'Dental, Dental Checkup & Cleaning, Root Canal Treatment',
      rating: 4.9,
      experienceYears: 8,
      bio: 'Senior Dental surgeon with 8+ years specializing in micro-endodontics and aesthetic dentistry.',
      availability: {
        create: [1, 2, 3, 4, 5].map(day => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00'
        }))
      }
    }
  });

  const johnStylistUser = await prisma.user.create({
    data: {
      email: 'john@smartbook.ai',
      password: passwordHash,
      name: 'John Barber',
      role: 'EMPLOYEE',
      phone: '+919876543211'
    }
  });

  const empJohn = await prisma.employee.create({
    data: {
      userId: johnStylistUser.id,
      skills: 'Salon, Premium Haircut & Styling, Global Hair Coloring',
      rating: 4.7,
      experienceYears: 5,
      bio: 'Creative hairstylist and grooming consultant certified in advanced L\'Oreal global cuts.',
      availability: {
        create: [2, 3, 4, 5, 6].map(day => ({
          dayOfWeek: day,
          startTime: '10:00',
          endTime: '19:00'
        }))
      }
    }
  });

  const emilyWellnessUser = await prisma.user.create({
    data: {
      email: 'emily@smartbook.ai',
      password: passwordHash,
      name: 'Emily Spa',
      role: 'EMPLOYEE',
      phone: '+919876543212'
    }
  });

  const empEmily = await prisma.employee.create({
    data: {
      userId: emilyWellnessUser.id,
      skills: 'Wellness, Swedish Massage Therapy',
      rating: 4.8,
      experienceYears: 6,
      bio: 'Registered massage therapist focusing on Swedish techniques and pain alleviation therapy.',
      availability: {
        create: [1, 3, 5, 6].map(day => ({
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '18:00'
        }))
      }
    }
  });

  const davidConsultantUser = await prisma.user.create({
    data: {
      email: 'david@smartbook.ai',
      password: passwordHash,
      name: 'David Consultant',
      role: 'EMPLOYEE',
      phone: '+919876543213'
    }
  });

  const empDavid = await prisma.employee.create({
    data: {
      userId: davidConsultantUser.id,
      skills: 'Consulting, Business Strategy Session',
      rating: 5.0,
      experienceYears: 10,
      bio: 'Startup advisor and corporate planner specializing in operations scale-up and investments.',
      availability: {
        create: [1, 2, 3, 4, 5].map(day => ({
          dayOfWeek: day,
          startTime: '11:00',
          endTime: '18:00'
        }))
      }
    }
  });

  // 5. Create Mock Appointments & Invoices
  console.log('Seeding appointments, payments and history...');
  
  // Completed Appointment (Past week)
  const pastDate1 = new Date();
  pastDate1.setDate(pastDate1.getDate() - 3);
  pastDate1.setHours(10, 0, 0, 0);
  const pastEndDate1 = new Date(pastDate1.getTime() + 45 * 60 * 1000);

  const pastApp1 = await prisma.appointment.create({
    data: {
      customerId: customerUser.id,
      employeeId: empSarah.id,
      serviceId: dentalService1.id,
      startTime: pastDate1,
      endTime: pastEndDate1,
      status: 'COMPLETED',
      noShowRisk: 'LOW',
      noShowProbability: 0.05,
      pricePaid: 1500,
      paymentStatus: 'PAID',
      notes: 'Customer reported minor sensitivity in molars.'
    }
  });

  // Create payment record for past appointment
  const invoiceNum1 = `INV-${new Date().getFullYear()}-827361`;
  await prisma.payment.create({
    data: {
      appointmentId: pastApp1.id,
      amount: 1500,
      currency: 'INR',
      razorpayOrderId: 'order_mock1',
      razorpayPaymentId: 'pay_mock1',
      status: 'SUCCESS',
      invoiceNumber: invoiceNum1
    }
  });

  // Create review for past appointment
  await prisma.review.create({
    data: {
      appointmentId: pastApp1.id,
      customerId: customerUser.id,
      rating: 5,
      comment: 'Excellent, highly professional dental cleanup. Dr. Sarah was extremely gentle and thorough.'
    }
  });

  // Cancelled Appointment (Past 2 days)
  const pastDate2 = new Date();
  pastDate2.setDate(pastDate2.getDate() - 2);
  pastDate2.setHours(14, 0, 0, 0);
  const pastEndDate2 = new Date(pastDate2.getTime() + 30 * 60 * 1000);

  await prisma.appointment.create({
    data: {
      customerId: customerUser.id,
      employeeId: empJohn.id,
      serviceId: salonService1.id,
      startTime: pastDate2,
      endTime: pastEndDate2,
      status: 'CANCELLED',
      noShowRisk: 'MEDIUM',
      noShowProbability: 0.35,
      paymentStatus: 'PENDING',
      notes: 'Client cancelled online because of scheduling overlap.'
    }
  });

  // Upcoming Appointment (Tomorrow)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 1000 * 60);

  await prisma.appointment.create({
    data: {
      customerId: customerUser.id,
      employeeId: empSarah.id,
      serviceId: dentalService2.id,
      startTime: tomorrow,
      endTime: tomorrowEnd,
      status: 'CONFIRMED',
      noShowRisk: 'LOW',
      noShowProbability: 0.12,
      paymentStatus: 'PENDING',
      notes: 'Patient requested numbing gel if possible.'
    }
  });

  // Upcoming Appointment 2 (Day after tomorrow)
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  dayAfter.setHours(15, 0, 0, 0);
  const dayAfterEnd = new Date(dayAfter.getTime() + 60 * 1000 * 45);

  await prisma.appointment.create({
    data: {
      customerId: customerUser2.id,
      employeeId: empDavid.id,
      serviceId: consultingService1.id,
      startTime: dayAfter,
      endTime: dayAfterEnd,
      status: 'CONFIRMED',
      noShowRisk: 'MEDIUM',
      noShowProbability: 0.28,
      paymentStatus: 'PENDING',
      notes: 'Consulting strategy roadmap discussions.'
    }
  });

  // 6. Create Waitlist Entry
  console.log('Seeding waitlist...');
  const preferredDateStr = new Date();
  preferredDateStr.setDate(preferredDateStr.getDate() + 1);
  const tomorrowStr = preferredDateStr.toISOString().split('T')[0];

  await prisma.waitlist.create({
    data: {
      customerId: customerUser2.id,
      serviceId: dentalService2.id,
      preferredDate: tomorrowStr,
      preferredTimeRange: '11:00-13:00',
      status: 'WAITING'
    }
  });

  // 7. Notifications
  console.log('Seeding notifications...');
  await prisma.notification.create({
    data: {
      userId: customerUser.id,
      title: 'Welcome to SmartBook AI!',
      message: 'Your account is setup successfully. Start using the AI scheduler or book services directly.',
      type: 'SYSTEM'
    }
  });

  await prisma.notification.create({
    data: {
      userId: customerUser.id,
      title: 'Payment Successful',
      message: `Payment of INR 1500 verified for Invoice ${invoiceNum1}.`,
      type: 'SYSTEM'
    }
  });

  console.log('SmartBook AI database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
