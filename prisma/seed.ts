import { ActivityType, OpportunityStatus, PipelineStage, PrismaClient } from "@prisma/client";
import { getProbabilityForStage } from "../src/lib/pipeline";

const prisma = new PrismaClient();

const opportunities: Array<{
  companyName: string;
  contactName?: string;
  email?: string;
  phone?: string;
  industry: string;
  product: string;
  opportunityType: string;
  stage: PipelineStage;
  estimatedValue: number;
  expectedCloseDate?: Date;
  nextStep?: string;
  nextStepDate?: Date;
  lastContactDate?: Date;
  status?: OpportunityStatus;
  notes?: string;
}> = [
  {
    companyName: "South Rand Mining Services",
    contactName: "Sarah Jones",
    email: "sarah.jones@example.com",
    phone: "0830000000",
    industry: "Mining",
    product: "Mining Training",
    opportunityType: "Corporate Training",
    stage: "PROPOSAL_SENT",
    estimatedValue: 185000,
    expectedCloseDate: new Date("2026-06-30"),
    nextStep: "Follow up on proposal with operations team",
    nextStepDate: new Date("2026-05-20"),
    lastContactDate: new Date("2026-05-15"),
    notes: "Training for contractor compliance and safety modules.",
  },
  {
    companyName: "Westonaria Engineering Group",
    contactName: "Michael Naidoo",
    industry: "Engineering",
    product: "Construction Asset Dashboard",
    opportunityType: "Software",
    stage: "MEETING_HELD",
    estimatedValue: 140000,
    expectedCloseDate: new Date("2026-07-10"),
    nextStep: "Send visual dashboard proposal",
    nextStepDate: new Date("2026-06-03"),
    lastContactDate: new Date("2026-05-26"),
  },
  {
    companyName: "BlueRock Corporate Training",
    contactName: "Lerato Mokoena",
    industry: "Corporate",
    product: "AI in the Workplace",
    opportunityType: "Corporate Course",
    stage: "DEMO_COMPLETED",
    estimatedValue: 95000,
    expectedCloseDate: new Date("2026-06-18"),
    nextStep: "Confirm rollout dates",
    nextStepDate: new Date("2026-06-01"),
    lastContactDate: new Date("2026-05-24"),
  },
  {
    companyName: "Unity Learning Prospect",
    contactName: "Ayesha Patel",
    industry: "Education",
    product: "Unity LMS",
    opportunityType: "Learning Platform",
    stage: "VERBAL_APPROVAL",
    estimatedValue: 220000,
    expectedCloseDate: new Date("2026-06-21"),
    nextStep: "Send invoice details",
    nextStepDate: new Date("2026-05-30"),
    lastContactDate: new Date("2026-05-23"),
  },
  {
    companyName: "Goldfields Contractor Services",
    contactName: "Pieter van Wyk",
    industry: "Mining",
    product: "Health and Safety Training",
    opportunityType: "Compliance Training",
    stage: "PAYMENT_RECEIVED",
    estimatedValue: 78000,
    expectedCloseDate: new Date("2026-05-16"),
    lastContactDate: new Date("2026-05-16"),
    status: "WON",
    notes: "Payment received for first cohort.",
  },
  {
    companyName: "TPC Trading Lead Group",
    contactName: "Nomsa Dlamini",
    industry: "Trading",
    product: "Trading Programme",
    opportunityType: "Skills Programme",
    stage: "LEAD_IDENTIFIED",
    estimatedValue: 45000,
    expectedCloseDate: new Date("2026-08-05"),
    nextStep: "Qualify decision-maker",
    nextStepDate: new Date("2026-05-22"),
    status: "ACTIVE",
  },
  {
    companyName: "Randfontein Plant Hire",
    contactName: "Johan Botha",
    industry: "Construction",
    product: "Vehicle/Fuel Management Dashboard",
    opportunityType: "Software",
    stage: "PROPOSAL_SENT",
    estimatedValue: 160000,
    expectedCloseDate: new Date("2026-07-02"),
    nextStep: "Clarify licence count",
    nextStepDate: new Date("2026-06-04"),
    lastContactDate: new Date("2026-05-25"),
  },
  {
    companyName: "Kajima Construction SA",
    contactName: "John Smith",
    industry: "Construction",
    product: "Asset Dashboard",
    opportunityType: "Software",
    stage: "NEED_CONFIRMED",
    estimatedValue: 120000,
    expectedCloseDate: new Date("2026-06-30"),
    nextStep: "Book demo",
    nextStepDate: new Date("2026-06-02"),
    lastContactDate: new Date("2026-05-26"),
  },
  {
    companyName: "BrightStart ECD Centre",
    contactName: "Martha Khumalo",
    industry: "Education",
    product: "ECD Training",
    opportunityType: "Training",
    stage: "CONTACT_MADE",
    estimatedValue: 52000,
    expectedCloseDate: new Date("2026-08-18"),
    nextStep: "Send course outline",
    nextStepDate: new Date("2026-06-07"),
    status: "ON_HOLD",
    notes: "Waiting for budget confirmation.",
  },
  {
    companyName: "SecureWorks Local",
    contactName: "David Jacobs",
    industry: "Professional Services",
    product: "Cyber Risk Programme",
    opportunityType: "Training",
    stage: "DECISION_MAKER_REACHED",
    estimatedValue: 110000,
    expectedCloseDate: new Date("2026-07-28"),
    nextStep: "Confirm risk workshop scope",
    nextStepDate: new Date("2026-06-06"),
    lastContactDate: new Date("2026-05-21"),
  },
  {
    companyName: "Metro Office Skills",
    contactName: "Zanele Sithole",
    industry: "Corporate",
    product: "Microsoft Office Training",
    opportunityType: "Corporate Training",
    stage: "LOST_NO_FIT",
    estimatedValue: 38000,
    expectedCloseDate: new Date("2026-05-31"),
    status: "LOST",
    notes: "Budget moved to internal training.",
  },
  {
    companyName: "FuturePath Schools Network",
    contactName: "Thabo Molefe",
    industry: "Education",
    product: "School Campaign / Learner Recruitment",
    opportunityType: "Campaign",
    stage: "PO_CONTRACT_INVOICE_REQUESTED",
    estimatedValue: 132000,
    expectedCloseDate: new Date("2026-06-12"),
    nextStep: "Issue invoice and confirm payment date",
    nextStepDate: new Date("2026-05-29"),
    lastContactDate: new Date("2026-05-24"),
  },
];

async function main() {
  await prisma.slipItem.deleteMany();
  await prisma.slipReceipt.deleteMany();
  await prisma.idea.deleteMany();
  await prisma.meetingInboxNote.deleteMany();
  await prisma.salesDocument.deleteMany();
  await prisma.touchpoint.deleteMany();
  await prisma.paymentSchedule.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.task.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.meetingAttachment.deleteMany();
  await prisma.meetingNote.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.salesperson.deleteMany();

  await prisma.salesperson.createMany({
    data: [
      {
        slug: "wesley",
        fullName: "Wesley",
        defaultCommissionRate: 0,
        notes: "Commission profile for Wesley. Final commission rules to be added once the contract structure is confirmed.",
      },
      {
        slug: "helena",
        fullName: "Helena",
        defaultCommissionRate: 0,
        notes: "Commission profile for Helena. Final commission rules to be added once the contract structure is confirmed.",
      },
    ],
  });

  for (const item of opportunities) {
    const opportunity = await prisma.opportunity.create({
      data: {
        ...item,
        probability: getProbabilityForStage(item.stage),
        status: item.status ?? "ACTIVE",
      },
    });

    const activities: Array<{ type: ActivityType; description: string; activityDate: Date }> = [];
    if (item.stage === "PROPOSAL_SENT") {
      activities.push({ type: "PROPOSAL_SENT", description: "Proposal sent for review.", activityDate: item.lastContactDate ?? new Date("2026-05-24") });
    }
    if (item.stage === "PAYMENT_RECEIVED") {
      activities.push({ type: "PAYMENT_RECEIVED", description: "Payment received. Final win achieved.", activityDate: new Date("2026-05-16") });
    }
    if (["MEETING_HELD", "DEMO_COMPLETED", "NEED_CONFIRMED"].includes(item.stage)) {
      activities.push({ type: "MEETING", description: "Discussion held and next step agreed.", activityDate: item.lastContactDate ?? new Date("2026-05-23") });
    }

    if (activities.length) {
      await prisma.activity.createMany({
        data: activities.map((activity) => ({ ...activity, opportunityId: opportunity.id })),
      });
    }

    if (["MEETING_HELD", "DEMO_COMPLETED", "PROPOSAL_SENT"].includes(item.stage)) {
      await prisma.meetingNote.create({
        data: {
          opportunityId: opportunity.id,
          title: `${item.product} discussion`,
          attendees: [item.contactName, "TPC Sales"].filter(Boolean).join(", "),
          summary: `Discussed ${item.product.toLowerCase()} requirements, current operational challenges and the commercial next step.`,
          customerNotes: "Client wants practical outcomes, clear timelines and a simple implementation plan.",
          nextActions: item.nextStep,
          meetingDate: item.lastContactDate ?? new Date("2026-05-24"),
        },
      });
    }

    if (item.stage === "PAYMENT_RECEIVED") {
      await prisma.paymentRecord.create({
        data: {
          opportunityId: opportunity.id,
          paymentType: "FINAL_PAYMENT",
          amount: item.estimatedValue,
          receivedDate: item.lastContactDate ?? new Date("2026-05-16"),
          reference: "Seed payment",
          notes: "Full payment received.",
        },
      });
    }

    if (item.companyName === "Unity Learning Prospect") {
      await prisma.paymentRecord.create({
        data: {
          opportunityId: opportunity.id,
          paymentType: "DEPOSIT",
          amount: 45000,
          receivedDate: new Date("2026-05-27"),
          reference: "Development deposit",
          notes: "Deposit received while final invoice and rollout dates are still being confirmed.",
        },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
