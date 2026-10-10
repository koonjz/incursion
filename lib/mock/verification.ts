import { MOCK_EVENTS } from "./events";
import { MOCK_CONFLICTS } from "./conflicts";
import { VerificationItem, VerificationQueueStats } from "../types/verification";

export const MOCK_VERIFICATION_STATS: VerificationQueueStats = {
  pendingCount: 7,
  highConflictsCount: 2,
  changesRequestedCount: 3,
  totalUnderReview: 12,
};

export const MOCK_VERIFICATION_QUEUE: VerificationItem[] = [
  {
    event: MOCK_EVENTS[0], // evt-101 (High conflict with IEEE)
    conflict: MOCK_CONFLICTS["cnf-201"],
    priority: "high",
    assignedTo: "Rohan Varma (Core Lead)",
    daysInQueue: 2,
  },
  {
    event: MOCK_EVENTS[3], // evt-104 (Critical conflict with Cultural Fest)
    conflict: MOCK_CONFLICTS["cnf-202"],
    priority: "high",
    assignedTo: "Rohan Varma (Core Lead)",
    daysInQueue: 3,
  },
  {
    event: MOCK_EVENTS[6], // evt-107 (Medium capacity conflict)
    conflict: MOCK_CONFLICTS["cnf-203"],
    priority: "medium",
    assignedTo: "Kavya S. (Logistics Lead)",
    daysInQueue: 4,
  },
  {
    event: MOCK_EVENTS[7], // evt-108 (Low conflict)
    conflict: MOCK_CONFLICTS["cnf-204"],
    priority: "standard",
    assignedTo: "Kavya S. (Logistics Lead)",
    daysInQueue: 1,
  },
  {
    event: {
      id: "evt-111",
      title: "Algorithmic Game Theory & Mechanism Design",
      eventType: "Guest Lecture",
      organizer: "ACM Student Chapter",
      club: "ACM Student Chapter",
      date: "2026-10-30",
      startTime: "16:00",
      endTime: "18:00",
      venue: "Turing Seminar Hall",
      expectedAttendance: 90,
      audience: ["CSE", "Technical", "Engineering"],
      description: "Invited academic talk on algorithmic pricing, Vickrey auctions, and modern matching markets in cloud resource allocation.",
      status: "pending",
      conflictSeverity: "none",
      submittedAt: "2026-10-07T14:00:00Z",
      updatedAt: "2026-10-07T14:00:00Z",
      submitterName: "Priya Nair",
      submitterEmail: "priya@acm.campus.edu",
    },
    priority: "standard",
    assignedTo: "Unassigned",
    daysInQueue: 1,
  },
  {
    event: {
      id: "evt-112",
      title: "Quantum Computing Foundations Workshop",
      eventType: "Workshop",
      organizer: "IEEE Student Branch",
      club: "IEEE Student Branch",
      date: "2026-11-02",
      startTime: "15:00",
      endTime: "18:00",
      venue: "Computing Lab 3",
      expectedAttendance: 70,
      audience: ["CSE", "ECE", "Technical"],
      description: "Hands-on quantum simulator algorithms with Qiskit covering superposition, entanglement, and Grover search.",
      status: "pending",
      conflictSeverity: "low",
      submittedAt: "2026-10-06T11:20:00Z",
      updatedAt: "2026-10-06T11:20:00Z",
      submitterName: "Aditya Kulkarni",
      submitterEmail: "aditya@ieee.campus.edu",
    },
    priority: "standard",
    assignedTo: "Rohan Varma (Core Lead)",
    daysInQueue: 2,
  },
  {
    event: {
      id: "evt-113",
      title: "Campus Debate Championship: Tech Ethics & AI Governance",
      eventType: "Competition",
      organizer: "Literary & Debating Society",
      club: "Student Activity Center",
      date: "2026-11-05",
      startTime: "17:00",
      endTime: "20:00",
      venue: "LT-2",
      expectedAttendance: 120,
      audience: ["General", "Engineering"],
      description: "Parliamentary style debate debating automated algorithmic decision making, liability, and campus data sovereignty.",
      status: "pending",
      conflictSeverity: "none",
      submittedAt: "2026-10-07T17:00:00Z",
      updatedAt: "2026-10-07T17:00:00Z",
      submitterName: "Samarjit Roy",
      submitterEmail: "samarjit@sac.campus.edu",
    },
    priority: "standard",
    assignedTo: "Unassigned",
    daysInQueue: 1,
  },
];
