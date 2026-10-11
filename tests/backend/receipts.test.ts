import { describe, it, expect } from "vitest";
import { signUploadSchema } from "@/src/modules/receipts/receiptService";

describe("receipts - Upload File Validation", () => {
  it("accepts valid PDF files under 5 MB", () => {
    const result = signUploadSchema.safeParse({
      fileName: "catering-invoice.pdf",
      fileSize: 2 * 1024 * 1024, // 2 MB
      mimeType: "application/pdf",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid JPEG and PNG files under 5 MB", () => {
    const jpegResult = signUploadSchema.safeParse({
      fileName: "badge-receipt.jpeg",
      fileSize: 1.5 * 1024 * 1024,
      mimeType: "image/jpeg",
    });
    expect(jpegResult.success).toBe(true);

    const pngResult = signUploadSchema.safeParse({
      fileName: "banner.png",
      fileSize: 3 * 1024 * 1024,
      mimeType: "image/png",
    });
    expect(pngResult.success).toBe(true);
  });

  it("rejects file exceeding 5 MB limit", () => {
    const result = signUploadSchema.safeParse({
      fileName: "large-video.pdf",
      fileSize: 6 * 1024 * 1024, // 6 MB
      mimeType: "application/pdf",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("File size must not exceed 5 MB");
    }
  });

  it("rejects unsupported MIME types like zip or exe", () => {
    const result = signUploadSchema.safeParse({
      fileName: "malicious.exe",
      fileSize: 1024,
      mimeType: "application/x-msdownload",
    });
    expect(result.success).toBe(false);
  });

  it("rejects zero or negative file sizes", () => {
    const result = signUploadSchema.safeParse({
      fileName: "empty.pdf",
      fileSize: 0,
      mimeType: "application/pdf",
    });
    expect(result.success).toBe(false);
  });
});
