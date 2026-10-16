export type EventType =
  | "Workshop"
  | "Symposium"
  | "Hackathon"
  | "Guest Lecture"
  | "Competition"
  | "Cultural"
  | "General Meeting"
  | "Networking"
  | "Technical Talk"
  | "Bootcamp"
  | "Ideathon"
  | "Project Exhibition"
  | "Conference"
  | "Seminar"
  | "Academic Talk"
  | "Coding Competition"
  | "Quiz"
  | "Case Study"
  | "Cultural Fest"
  | "Music"
  | "Dance"
  | "Art & Design"
  | "Photography"
  | "Literary"
  | "Open Mic"
  | "Club Recruitment"
  | "Orientation"
  | "Alumni Talk"
  | "Panel Discussion"
  | "Awareness Campaign"
  | "Sports"
  | "Sports Tournament"
  | "Social"
  | "Other";

export type EventStatus =
  | "draft"
  | "pending"
  | "approved"
  | "changes_requested"
  | "rejected";

export type ConflictSeverity = "critical" | "high" | "medium" | "low" | "none";

export interface ReviewItem {
  id: string;
  reviewerName: string;
  reviewerRole: string;
  decision: "approved" | "changes_requested" | "rejected" | "submitted";
  comment: string;
  timestamp: string;
  changesRequested?: string[];
}

export interface CampusEvent {
  id: string;
  title: string;
  eventType: EventType;
  organizer: string;
  club: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "17:00"
  endTime: string; // "19:00"
  venue: string;
  expectedAttendance: number;
  audience: string[];
  description: string;
  status: EventStatus;
  conflictSeverity: ConflictSeverity;
  conflictId?: string;
  submittedAt: string;
  updatedAt: string;
  submitterName: string;
  submitterEmail: string;
  reviews?: ReviewItem[];
}

export interface Club {
  id: string;
  name: string;
  category: "Technical" | "Cultural" | "Academic" | "Sports" | "Departmental";
  leadEmail: string;
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  building: string;
  facilities: string[];
}
