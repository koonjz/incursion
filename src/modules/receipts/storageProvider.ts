import crypto from "crypto";
import { APP_CONFIG } from "@/src/config";

export interface SignUploadParams {
  fileName: string;
  mimeType: string;
  fileSize: number;
  folder?: string;
}

export interface SignedUploadResult {
  uploadUrl: string;
  fields: Record<string, string>;
  fileKey: string;
  provider: "cloudinary" | "s3" | "mock";
}

export interface IStorageProvider {
  getSignedUpload(params: SignUploadParams): Promise<SignedUploadResult>;
  getSignedDownloadUrl(fileKey: string, expiresInSeconds?: number): Promise<string>;
}

/**
 * Cloudinary signed upload provider.
 * Computes signature using api_secret without ever exposing it to client.
 */
export class CloudinaryProvider implements IStorageProvider {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = APP_CONFIG.storage.cloudinary.cloudName || "";
    this.apiKey = APP_CONFIG.storage.cloudinary.apiKey || "";
    this.apiSecret = APP_CONFIG.storage.cloudinary.apiSecret || "";

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error(
        "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
      );
    }
  }

  async getSignedUpload(params: SignUploadParams): Promise<SignedUploadResult> {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = params.folder || "receipts";
    const cleanName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const publicId = `${folder}/${Date.now()}-${cleanName}`;

    // Cloudinary signature calculation: sorted params query string hashed with SHA1
    const toSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      fields: {
        api_key: this.apiKey,
        timestamp: String(timestamp),
        signature,
        folder,
        public_id: publicId,
      },
      fileKey: publicId,
      provider: "cloudinary",
    };
  }

  async getSignedDownloadUrl(fileKey: string): Promise<string> {
    return `https://res.cloudinary.com/${this.cloudName}/image/upload/fl_attachment/${fileKey}`;
  }
}

/**
 * AWS S3 presigned URL provider.
 */
export class S3Provider implements IStorageProvider {
  private bucket: string;
  private region: string;

  constructor() {
    this.bucket = APP_CONFIG.storage.s3.bucket || "";
    this.region = APP_CONFIG.storage.s3.region;

    if (!this.bucket) {
      throw new Error("Missing AWS S3 configuration. Set AWS_S3_BUCKET.");
    }
  }

  async getSignedUpload(params: SignUploadParams): Promise<SignedUploadResult> {
    const cleanName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileKey = `receipts/${Date.now()}-${cleanName}`;
    const uploadUrl = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}`;

    return {
      uploadUrl,
      fields: {
        "Content-Type": params.mimeType,
        key: fileKey,
      },
      fileKey,
      provider: "s3",
    };
  }

  async getSignedDownloadUrl(fileKey: string, expiresInSeconds = 3600): Promise<string> {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${fileKey}?expires=${expiresInSeconds}`;
  }
}

/**
 * Development & testing storage provider.
 */
export class MockStorageProvider implements IStorageProvider {
  private baseUrl: string;

  constructor(baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000") {
    this.baseUrl = baseUrl.replace(/\/$/, "");
  }

  async getSignedUpload(params: SignUploadParams): Promise<SignedUploadResult> {
    const fileKey = `receipts/${Date.now()}-${params.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    return {
      uploadUrl: `${this.baseUrl}/api/receipts/mock-upload`,
      fields: {
        fileKey,
      },
      fileKey,
      provider: "mock",
    };
  }

  async getSignedDownloadUrl(fileKey: string): Promise<string> {
    return `${this.baseUrl}/api/receipts/download?key=${encodeURIComponent(fileKey)}`;
  }
}

export function getStorageProvider(): IStorageProvider {
  if (APP_CONFIG.storage.provider === "s3") {
    return new S3Provider();
  }
  if (APP_CONFIG.storage.provider === "cloudinary") {
    return new CloudinaryProvider();
  }
  return new MockStorageProvider();
}
