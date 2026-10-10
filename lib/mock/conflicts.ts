import { EventConflict } from "../types/conflict";

export const MOCK_CONFLICTS: Record<string, EventConflict> = {
  "cnf-201": {
    id: "cnf-201",
    targetEventId: "evt-101",
    competingEventId: "evt-102",
    severity: "high",
    headline: "Potential scheduling overlap detected with IEEE Technical Symposium",
    summary: "Your proposed workshop in LT-2 overlaps with an already-approved IEEE Symposium for 1 hour 30 minutes, sharing the exact venue and target academic audience.",
    overlapMinutes: 90,
    overlapWindow: "5:30 PM — 7:00 PM",
    yourEvent: {
      title: "Technical Workshop: Distributed Systems with Go",
      organizer: "ACM × Web Development Club",
      date: "2026-10-15",
      startTime: "17:00",
      endTime: "19:00",
      venue: "LT-2",
      expectedAttendance: 150,
      audience: ["CSE", "Technical", "Engineering"],
      eventType: "Workshop",
    },
    competingEvent: {
      title: "Technical Symposium: Next-Gen Autonomous Systems",
      organizer: "IEEE Student Branch",
      date: "2026-10-15",
      startTime: "17:30",
      endTime: "19:30",
      venue: "LT-2",
      expectedAttendance: 300,
      audience: ["CSE", "ECE", "Technical", "Engineering"],
      eventType: "Symposium",
    },
    reasons: [
      {
        id: "rsn-1",
        code: "TIME_OVERLAP",
        title: "Time overlap",
        detail: "1h 30m overlap detected between 5:30 PM and 7:00 PM on October 15, 2026.",
        severity: "critical",
      },
      {
        id: "rsn-2",
        code: "SAME_VENUE",
        title: "Same venue",
        detail: "Both events require exclusive occupancy of LT-2 (Lecture Theater 2).",
        severity: "critical",
      },
      {
        id: "rsn-3",
        code: "AUDIENCE_OVERLAP",
        title: "Audience overlap",
        detail: "82% cohort overlap: Both sessions heavily target upper-division CSE & Engineering undergraduates.",
        severity: "high",
      },
      {
        id: "rsn-4",
        code: "SIMILAR_TYPE",
        title: "Similar event type",
        detail: "Both events are technical skill/research gatherings competing for campus mindshare on the same evening.",
        severity: "medium",
      },
    ],
    suggestedSlots: [
      {
        id: "sug-1",
        date: "2026-10-15",
        startTime: "15:00",
        endTime: "17:00",
        startTimeFormatted: "3:00 PM",
        endTimeFormatted: "5:00 PM",
        venue: "LT-2",
        rationale: "Precedes IEEE setup with zero facility clash in LT-2.",
        isRecommended: true,
      },
      {
        id: "sug-2",
        date: "2026-10-15",
        startTime: "19:30",
        endTime: "21:30",
        startTimeFormatted: "7:30 PM",
        endTimeFormatted: "9:30 PM",
        venue: "LT-2",
        rationale: "Commences immediately following IEEE symposium teardown.",
        isRecommended: false,
      },
      {
        id: "sug-3",
        date: "2026-10-15",
        startTime: "17:00",
        endTime: "19:00",
        startTimeFormatted: "5:00 PM",
        endTimeFormatted: "7:00 PM",
        venue: "Turing Seminar Hall",
        rationale: "Maintains preferred time slot by switching to Turing Hall (capacity 120+).",
        isRecommended: false,
      },
    ],
    checks: {
      venueAvailable: false,
      organizerAvailable: true,
      audienceClear: false,
      timeClear: false,
    },
  },
  "cnf-202": {
    id: "cnf-202",
    targetEventId: "evt-104",
    competingEventId: "evt-105",
    severity: "critical",
    headline: "Direct venue clash in Main Auditorium A with Campus Cultural Fest",
    summary: "HackResolve 24-hr setup collides directly with Campus Cultural Evening occupying Main Auditorium A from 2:00 PM onwards.",
    overlapMinutes: 420,
    overlapWindow: "2:00 PM — 9:00 PM",
    yourEvent: {
      title: "HackResolve: 24-Hour Autonomous Agents Hackathon",
      organizer: "ACM × Machine Intelligence Group",
      date: "2026-10-24",
      startTime: "09:00",
      endTime: "21:00",
      venue: "Main Auditorium A",
      expectedAttendance: 450,
      audience: ["CSE", "ECE", "Technical", "Engineering", "General"],
      eventType: "Hackathon",
    },
    competingEvent: {
      title: "Campus Cultural Evening & Musical Night",
      organizer: "Student Council Cultural Committee",
      date: "2026-10-24",
      startTime: "14:00",
      endTime: "22:00",
      venue: "Main Auditorium A",
      expectedAttendance: 580,
      audience: ["General", "Engineering"],
      eventType: "Cultural",
    },
    reasons: [
      {
        id: "rsn-201",
        code: "SAME_VENUE",
        title: "Exact venue collision",
        detail: "Main Auditorium A is locked for acoustic rehearsals and stage setup from 2:00 PM.",
        severity: "critical",
      },
      {
        id: "rsn-202",
        code: "TIME_OVERLAP",
        title: "7-Hour schedule collision",
        detail: "420 minutes direct scheduling overlap on October 24, 2026.",
        severity: "critical",
      },
    ],
    suggestedSlots: [
      {
        id: "sug-201",
        date: "2026-10-24",
        startTime: "09:00",
        endTime: "21:00",
        startTimeFormatted: "9:00 AM",
        endTimeFormatted: "9:00 PM",
        venue: "SAC Multi-Purpose Hall 1",
        rationale: "Relocate hackathon floor to SAC Hall 1 with uninterrupted 24-hr access.",
        isRecommended: true,
      },
      {
        id: "sug-202",
        date: "2026-10-25",
        startTime: "09:00",
        endTime: "21:00",
        startTimeFormatted: "9:00 AM",
        endTimeFormatted: "9:00 PM",
        venue: "Main Auditorium A",
        rationale: "Shift Hackathon start by 24 hours to Sunday morning post-cleanup.",
        isRecommended: false,
      },
    ],
    checks: {
      venueAvailable: false,
      organizerAvailable: true,
      audienceClear: true,
      timeClear: false,
    },
  },
  "cnf-203": {
    id: "cnf-203",
    targetEventId: "evt-107",
    competingEventId: "sem-cap",
    severity: "medium",
    headline: "Room capacity alert: Expected headcount approaches physical safety limit",
    summary: "Seminar Room 402 has maximum permitted fire capacity of 60 attendees; 55 expected attendees leaves narrow safety margin.",
    overlapMinutes: 0,
    overlapWindow: "No time collision",
    yourEvent: {
      title: "UI/UX Design Jam: Accessibility First",
      organizer: "Design & UX Guild",
      date: "2026-10-20",
      startTime: "16:30",
      endTime: "19:00",
      venue: "Seminar Room 402",
      expectedAttendance: 55,
      audience: ["General", "Technical", "First Year"],
      eventType: "Workshop",
    },
    competingEvent: {
      title: "Facility Regulations: Room 402 Fire Limit",
      organizer: "Campus Infrastructure & Safety",
      date: "2026-10-20",
      startTime: "16:30",
      endTime: "19:00",
      venue: "Seminar Room 402",
      expectedAttendance: 60,
      audience: ["Facility Policy"],
      eventType: "Policy Constraint",
    },
    reasons: [
      {
        id: "rsn-301",
        code: "CAPACITY_OVERLOAD",
        title: "Near capacity threshold",
        detail: "55 registered spots exceeds 90% room rating for physical prototyping movement.",
        severity: "medium",
      },
    ],
    suggestedSlots: [
      {
        id: "sug-301",
        date: "2026-10-20",
        startTime: "16:30",
        endTime: "19:00",
        startTimeFormatted: "4:30 PM",
        endTimeFormatted: "7:00 PM",
        venue: "Turing Seminar Hall",
        rationale: "Turing Hall provides 120 seats and flexible tables for interactive design critique.",
        isRecommended: true,
      },
    ],
    checks: {
      venueAvailable: true,
      organizerAvailable: true,
      audienceClear: true,
      timeClear: true,
    },
  },
  "cnf-204": {
    id: "cnf-204",
    targetEventId: "evt-108",
    competingEventId: "evt-106",
    severity: "low",
    headline: "Adjacent schedule advisory with Computing Lab 3 algorithmic contest",
    summary: "Minor timing proximity on adjacent campus dates. Negligible scheduling friction detected.",
    overlapMinutes: 0,
    overlapWindow: "Separate dates",
    yourEvent: {
      title: "Robotics Hardware Boot Camp: Microcontrollers",
      organizer: "Robotics & Automation Society",
      date: "2026-10-22",
      startTime: "15:00",
      endTime: "18:00",
      venue: "SAC Multi-Purpose Hall 1",
      expectedAttendance: 140,
      audience: ["ECE", "Technical", "Engineering"],
      eventType: "Workshop",
    },
    competingEvent: {
      title: "Algorithmic Showdown: Fall Code Sprint",
      organizer: "Competitive Programming Wing",
      date: "2026-10-18",
      startTime: "14:00",
      endTime: "17:30",
      venue: "Computing Lab 3",
      expectedAttendance: 85,
      audience: ["CSE", "Technical"],
      eventType: "Competition",
    },
    reasons: [
      {
        id: "rsn-401",
        code: "AUDIENCE_OVERLAP",
        title: "Minor cohort interest overlap",
        detail: "Both events feature technical components attractive to engineering sophomores.",
        severity: "low",
      },
    ],
    suggestedSlots: [],
    checks: {
      venueAvailable: true,
      organizerAvailable: true,
      audienceClear: true,
      timeClear: true,
    },
  },
};

// Helper function to simulate live conflict evaluation during submission
export function evaluateLiveConflict(params: {
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  expectedAttendance: number;
  audience: string[];
  eventType: string;
}): EventConflict | null {
  const { date, startTime, endTime, venue, audience } = params;

  // If user picks LT-2 on 2026-10-15 and times overlap with 17:30 - 19:30
  if (venue.includes("LT-2") && date === "2026-10-15") {
    // Check time overlap with 17:30 - 19:30
    const startMins = parseTimeToMinutes(startTime);
    const endMins = parseTimeToMinutes(endTime);
    const sympStart = 17 * 60 + 30; // 17:30 = 1050
    const sympEnd = 19 * 60 + 30;   // 19:30 = 1170

    if (startMins < sympEnd && endMins > sympStart) {
      const overlapStart = Math.max(startMins, sympStart);
      const overlapEnd = Math.min(endMins, sympEnd);
      const overlap = Math.max(0, overlapEnd - overlapStart);

      return {
        ...MOCK_CONFLICTS["cnf-201"],
        overlapMinutes: overlap,
        yourEvent: {
          title: params.eventType ? `${params.eventType} Submission` : "Proposed Session",
          organizer: "Your Organization",
          date,
          startTime,
          endTime,
          venue,
          expectedAttendance: params.expectedAttendance || 120,
          audience: audience.length > 0 ? audience : ["CSE", "Technical"],
          eventType: params.eventType || "Workshop",
        },
      };
    }
  }

  // If venue is Main Auditorium A on 2026-10-24
  if (venue.includes("Auditorium A") && date === "2026-10-24") {
    return MOCK_CONFLICTS["cnf-202"];
  }

  // If venue is Seminar Room 402 and attendance > 50
  if (venue.includes("402") && params.expectedAttendance > 50) {
    return MOCK_CONFLICTS["cnf-203"];
  }

  return null;
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}
