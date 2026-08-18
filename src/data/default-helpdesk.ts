import type { TicketPriority, TicketStatus } from "@/lib/helpdesk";

export type DefaultTicket = {
  ticket_no: string;
  subject: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  branch: string;
  device_serial: string;
};

export type DefaultReview = {
  author: string;
  company: string;
  rating: number;
  text: string;
  approved: boolean;
};

export const DEFAULT_TICKETS: DefaultTicket[] = [
  {
    ticket_no: "TCK-1001",
    subject: "CCTV Camera stream lagging across North Gate zone",
    description: "IP camera feed on channel 4 & 7 is dropping frames and showing high latency during peak traffic hours.",
    priority: "high",
    status: "open",
    category: "hardware",
    branch: "Main Campus - Gate 1",
    device_serial: "CAM-4K-98214",
  },
  {
    ticket_no: "TCK-1002",
    subject: "Biometric Access Control Reader unresponsive at Data Center",
    description: "Card reader RFID LED blinks red and does not unlock server room door #3.",
    priority: "urgent",
    status: "in_progress",
    category: "security",
    branch: "HQ - Floor 2",
    device_serial: "AC-BIO-5510",
  },
  {
    ticket_no: "TCK-1003",
    subject: "Fire Alarm panel routine quarterly sensor calibration",
    description: "Scheduled preventative maintenance and sensor smoke detection calibration as per SLA contract.",
    priority: "medium",
    status: "resolved",
    category: "maintenance",
    branch: "East Warehouse",
    device_serial: "FA-ADDR-200",
  },
];

export const DEFAULT_REVIEWS: DefaultReview[] = [
  {
    author: "Eng. Tariq Al-Mansoor",
    company: "Saudi Aramco Supplier Network",
    rating: 5,
    text: "Outstanding engineering execution on our multi-site IP telephony and unified communications rollout. The team delivered ahead of schedule.",
    approved: true,
  },
  {
    author: "Sara Al-Otaibi",
    company: "Riyadh Logistics Park",
    rating: 5,
    text: "The smart surveillance and automated gate barrier integration has significantly streamlined our perimeter security operations.",
    approved: true,
  },
  {
    author: "Mohamed El-Sayed",
    company: "Cairo Technology Hub",
    rating: 4,
    text: "Great support response time and professional technical staff. Handled our server room fire suppression commissioning flawlessly.",
    approved: true,
  },
];
