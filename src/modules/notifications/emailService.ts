export interface ConflictAlertEmailData {
  to: string;
  eventName: string;
  conflictType: string;
  severity: string;
  details: string;
}

export interface ReviewDecisionEmailData {
  to: string;
  eventName: string;
  decision: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
  reviewerName: string;
  comment?: string;
}

export interface ConflictResolvedEmailData {
  to: string;
  eventName: string;
  conflictId: string;
  resolvedByName: string;
  notes?: string;
}

export interface IEmailSender {
  sendConflictAlert(data: ConflictAlertEmailData): Promise<boolean>;
  sendReviewDecision(data: ReviewDecisionEmailData): Promise<boolean>;
  sendConflictResolved(data: ConflictResolvedEmailData): Promise<boolean>;
}

/**
 * Mock email sender for tests and development.
 */
export class MockEmailSender implements IEmailSender {
  public sentEmails: Array<{ type: string; data: unknown; timestamp: Date }> = [];

  async sendConflictAlert(data: ConflictAlertEmailData): Promise<boolean> {
    this.sentEmails.push({ type: "CONFLICT_ALERT", data, timestamp: new Date() });
    return true;
  }

  async sendReviewDecision(data: ReviewDecisionEmailData): Promise<boolean> {
    this.sentEmails.push({ type: "REVIEW_DECISION", data, timestamp: new Date() });
    return true;
  }

  async sendConflictResolved(data: ConflictResolvedEmailData): Promise<boolean> {
    this.sentEmails.push({ type: "CONFLICT_RESOLVED", data, timestamp: new Date() });
    return true;
  }
}

/**
 * Resend Email Provider implementation.
 */
import { APP_CONFIG } from "@/src/config";

export class ResendEmailSender implements IEmailSender {
  private apiKey: string;
  private fromEmail: string;

  constructor(
    apiKey = APP_CONFIG.email.resendApiKey,
    fromEmail = APP_CONFIG.email.fromEmail || ""
  ) {
    this.apiKey = apiKey || "";
    this.fromEmail = fromEmail;
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.apiKey) {
      console.warn("RESEND_API_KEY not configured. Falling back to console log.");
      return true;
    }

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: [to],
          subject,
          html,
        }),
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to send email via Resend:", err);
      return false;
    }
  }

  async sendConflictAlert(data: ConflictAlertEmailData): Promise<boolean> {
    const subject = `[ACM Resolve] Alert: ${data.severity} conflict detected for "${data.eventName}"`;
    const html = `
      <h2>Scheduling Conflict Detected</h2>
      <p>A <strong>${data.severity}</strong> conflict (${data.conflictType}) was detected for <strong>${data.eventName}</strong>.</p>
      <p>${data.details}</p>
      <p>Please review your event schedule in the campus events portal.</p>
    `;
    return this.send(data.to, subject, html);
  }

  async sendReviewDecision(data: ReviewDecisionEmailData): Promise<boolean> {
    const subject = `[ACM Resolve] Event Review: "${data.eventName}" is ${data.decision}`;
    const html = `
      <h2>Event Review Decision</h2>
      <p>Your event <strong>${data.eventName}</strong> has been <strong>${data.decision}</strong> by ${data.reviewerName}.</p>
      ${data.comment ? `<p><strong>Feedback:</strong> ${data.comment}</p>` : ""}
    `;
    return this.send(data.to, subject, html);
  }

  async sendConflictResolved(data: ConflictResolvedEmailData): Promise<boolean> {
    const subject = `[ACM Resolve] Conflict Resolved: "${data.eventName}"`;
    const html = `
      <h2>Conflict Resolved</h2>
      <p>The scheduling conflict on <strong>${data.eventName}</strong> has been marked as resolved by ${data.resolvedByName}.</p>
      ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}
    `;
    return this.send(data.to, subject, html);
  }
}

// Export singleton instance based on environment
export const emailSender: IEmailSender =
  process.env.NODE_ENV === "test" || !process.env.RESEND_API_KEY
    ? new MockEmailSender()
    : new ResendEmailSender();
