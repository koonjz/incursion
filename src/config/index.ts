/**
 * Application Configuration
 * Centralizes all environment-driven configurations and eliminates hardcoded values.
 */

export const APP_CONFIG = {
  auth: {
    allowedEmailDomain: process.env.ALLOWED_EMAIL_DOMAIN,
    nextAuthSecret: process.env.NEXTAUTH_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  },
  email: {
    resendApiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.EMAIL_FROM,
  },
  storage: {
    provider: (process.env.STORAGE_PROVIDER as "cloudinary" | "s3" | "mock" | undefined) || "mock",
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },
    s3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || "us-east-1",
    },
    maxFileSizeBytes: process.env.MAX_FILE_SIZE_BYTES
      ? parseInt(process.env.MAX_FILE_SIZE_BYTES, 10)
      : 5 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "application/pdf"] as const,
  },
  conflicts: {
    defaultBufferMinutes: process.env.DEFAULT_BUFFER_MINUTES
      ? parseInt(process.env.DEFAULT_BUFFER_MINUTES, 10)
      : 15,
    weights: {
      venue: process.env.CONFLICT_WEIGHT_VENUE
        ? parseInt(process.env.CONFLICT_WEIGHT_VENUE, 10)
        : 40,
      organizer: process.env.CONFLICT_WEIGHT_ORGANIZER
        ? parseInt(process.env.CONFLICT_WEIGHT_ORGANIZER, 10)
        : 30,
      resource: process.env.CONFLICT_WEIGHT_RESOURCE
        ? parseInt(process.env.CONFLICT_WEIGHT_RESOURCE, 10)
        : 15,
      group: process.env.CONFLICT_WEIGHT_GROUP
        ? parseInt(process.env.CONFLICT_WEIGHT_GROUP, 10)
        : 10,
      buffer: process.env.CONFLICT_WEIGHT_BUFFER
        ? parseInt(process.env.CONFLICT_WEIGHT_BUFFER, 10)
        : 5,
    },
    severityThresholds: {
      critical: process.env.SEVERITY_THRESHOLD_CRITICAL
        ? parseInt(process.env.SEVERITY_THRESHOLD_CRITICAL, 10)
        : 85,
      high: process.env.SEVERITY_THRESHOLD_HIGH
        ? parseInt(process.env.SEVERITY_THRESHOLD_HIGH, 10)
        : 60,
      medium: process.env.SEVERITY_THRESHOLD_MEDIUM
        ? parseInt(process.env.SEVERITY_THRESHOLD_MEDIUM, 10)
        : 30,
    },
    workingHours: {
      start: process.env.WORKING_HOURS_START
        ? parseInt(process.env.WORKING_HOURS_START, 10)
        : 8,
      end: process.env.WORKING_HOURS_END
        ? parseInt(process.env.WORKING_HOURS_END, 10)
        : 20,
    },
  },
  pagination: {
    defaultLimit: process.env.DEFAULT_PAGE_LIMIT
      ? parseInt(process.env.DEFAULT_PAGE_LIMIT, 10)
      : 10,
    maxLimit: process.env.MAX_PAGE_LIMIT
      ? parseInt(process.env.MAX_PAGE_LIMIT, 10)
      : 50,
  },
};
