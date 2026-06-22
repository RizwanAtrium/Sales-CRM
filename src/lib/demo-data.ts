export const metrics = [
  { label: "Revenue collected", value: "$84,320", change: "+12.4%", trend: "up", tone: "primary" },
  { label: "Follow-ups due", value: "38", change: "12 overdue", trend: "alert", tone: "amber" },
  { label: "Closed won", value: "24", change: "+6 this month", trend: "up", tone: "emerald" },
  { label: "Close rate", value: "31.8%", change: "+4.2%", trend: "up", tone: "violet" },
] as const;

export const followUps = [
  { id: "LD-2084", customer: "Maya Robinson", business: "Halo Beauty Studio", agent: "Uzma Khan", due: "09:30 AM", status: "Overdue", source: "Meta Ads" },
  { id: "LD-2078", customer: "Daniel Scott", business: "DS Roofing", agent: "Haroon Ali", due: "11:00 AM", status: "Due today", source: "Cold Calling" },
  { id: "LD-2069", customer: "Olivia Bennett", business: "Bennett Realty", agent: "Rohan Malik", due: "01:15 PM", status: "Due today", source: "Referral" },
  { id: "LD-2061", customer: "Ava Williams", business: "Luxe Locs", agent: "Uzma Khan", due: "Yesterday", status: "Overdue", source: "Google / SEO" },
];

export const teamPerformance = [
  { name: "Uzma Khan", role: "Setter", initials: "UK", calls: 342, appointments: 28, won: 8, rate: 76 },
  { name: "Haroon Ali", role: "Closer", initials: "HA", calls: 284, appointments: 24, won: 11, rate: 88 },
  { name: "Rohan Malik", role: "Setter", initials: "RM", calls: 317, appointments: 22, won: 6, rate: 68 },
  { name: "Ali Raza", role: "Team Lead", initials: "AR", calls: 196, appointments: 19, won: 9, rate: 82 },
];

export const pipeline = [
  { stage: "Submitted", count: 42, value: "$126k", percent: 100 },
  { stage: "Approved", count: 31, value: "$98k", percent: 74 },
  { stage: "In progress", count: 18, value: "$67k", percent: 43 },
  { stage: "Closed won", count: 13, value: "$46k", percent: 31 },
];

export const leads = [
  { id: "LD-2084", customer: "Maya Robinson", business: "Halo Beauty Studio", source: "Meta Ads", agent: "Uzma Khan", teamLeadCloser: "Ali Raza", callback: "Today, 9:30 AM", stage: "Follow-up", value: "$4,500" },
  { id: "LD-2078", customer: "Daniel Scott", business: "DS Roofing", source: "Cold Calling", agent: "Haroon Ali", teamLeadCloser: "Ali Raza", callback: "Today, 11:00 AM", stage: "Approved", value: "$8,200" },
  { id: "LD-2069", customer: "Olivia Bennett", business: "Bennett Realty", source: "Referral", agent: "Rohan Malik", teamLeadCloser: "Sales Manager", callback: "Today, 1:15 PM", stage: "Submitted", value: "$3,800" },
  { id: "LD-2061", customer: "Ava Williams", business: "Luxe Locs", source: "Google / SEO", agent: "Uzma Khan", teamLeadCloser: "Ali Raza", callback: "Yesterday", stage: "In Progress", value: "$6,100" },
  { id: "LD-2057", customer: "Noah Carter", business: "Carter Contracting", source: "LinkedIn", agent: "Haroon Ali", teamLeadCloser: "Haroon Ali", callback: "Jun 23", stage: "Closed Won", value: "$12,400" },
  { id: "LD-2048", customer: "Emma Parker", business: "Parker Dental", source: "Cold Calling", agent: "Rohan Malik", teamLeadCloser: "Sales Manager", callback: "Jun 25", stage: "New", value: "$5,750" },
];

export const opportunities = [
  { id: "OP-481", business: "Halo Beauty Studio", contact: "Maya Robinson", value: "$4,500", owner: "Uzma Khan", age: "1d", stage: "Submitted" },
  { id: "OP-476", business: "Bennett Realty", contact: "Olivia Bennett", value: "$3,800", owner: "Rohan Malik", age: "2d", stage: "Submitted" },
  { id: "OP-470", business: "DS Roofing", contact: "Daniel Scott", value: "$8,200", owner: "Haroon Ali", age: "3d", stage: "Approved" },
  { id: "OP-463", business: "Luxe Locs", contact: "Ava Williams", value: "$6,100", owner: "Ali Raza", age: "5d", stage: "In Progress" },
  { id: "OP-452", business: "Carter Contracting", contact: "Noah Carter", value: "$12,400", owner: "Haroon Ali", age: "8d", stage: "Closed Won" },
];

export const payments = [
  { invoice: "PAY-1048", client: "Carter Contracting", total: "$12,400", received: "$12,400", outstanding: "$0", status: "Paid in full", date: "Jun 18, 2026" },
  { invoice: "PAY-1042", client: "Northside Dental", total: "$8,500", received: "$5,000", outstanding: "$3,500", status: "Partial · 59%", date: "Jun 16, 2026" },
  { invoice: "PAY-1037", client: "Luxe Kitchens", total: "$6,200", received: "$2,000", outstanding: "$4,200", status: "Partial · 32%", date: "Jun 13, 2026" },
  { invoice: "PAY-1029", client: "Prime Realty", total: "$4,800", received: "$0", outstanding: "$4,800", status: "Unpaid", date: "Jun 10, 2026" },
];

export const auditEntries = [
  { time: "Today, 10:42 AM", actor: "Ali Raza", action: "Approved appointment", target: "OP-470 · DS Roofing", type: "status" },
  { time: "Today, 10:18 AM", actor: "Uzma Khan", action: "Updated callback date", target: "LD-2084 · Halo Beauty", type: "edit" },
  { time: "Today, 9:54 AM", actor: "Haroon Ali", action: "Recorded payment", target: "PAY-1048 · $12,400", type: "payment" },
  { time: "Today, 9:22 AM", actor: "Asad", action: "Reassigned lead", target: "LD-2078 · Haroon Ali", type: "user" },
  { time: "Yesterday, 5:38 PM", actor: "Rohan Malik", action: "Created lead", target: "LD-2069 · Bennett Realty", type: "create" },
];
