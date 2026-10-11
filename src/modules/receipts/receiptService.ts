import { z } from "zod";
import { prisma } from "@/src/lib/prisma";
import { getStorageProvider, IStorageProvider } from "./storageProvider";

import { APP_CONFIG } from "@/src/config";

export const signUploadSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(
      APP_CONFIG.storage.maxFileSizeBytes,
      `File size must not exceed ${Math.round(APP_CONFIG.storage.maxFileSizeBytes / (1024 * 1024))} MB`
    ),
  mimeType: z.enum(APP_CONFIG.storage.allowedMimeTypes, {
    message: "Invalid file type. Only JPEG, PNG, and PDF files are allowed",
  }),
});

export type SignUploadInput = z.infer<typeof signUploadSchema>;

/**
 * Validates file parameters and generates signed upload URL and parameters.
 */
export async function generateSignedUpload(
  input: SignUploadInput,
  provider: IStorageProvider = getStorageProvider()
) {
  // Validate input schema
  const validated = signUploadSchema.parse(input);

  const signed = await provider.getSignedUpload({
    fileName: validated.fileName,
    mimeType: validated.mimeType,
    fileSize: validated.fileSize,
  });

  // Create preliminary Receipt record in database
  const receipt = await prisma.receipt.create({
    data: {
      fileName: validated.fileName,
      fileSize: validated.fileSize,
      mimeType: validated.mimeType,
      fileUrl: signed.uploadUrl,
      storageProvider: signed.provider,
    },
  });

  return {
    receiptId: receipt.id,
    fileKey: signed.fileKey,
    uploadUrl: signed.uploadUrl,
    fields: signed.fields,
    provider: signed.provider,
    expiresInSeconds: 3600,
  };
}

/**
 * Retrieves a short-lived signed download URL for an uploaded receipt.
 */
export async function getReceiptDownloadUrl(
  receiptId: string,
  provider: IStorageProvider = getStorageProvider()
) {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: { expense: true },
  });

  if (!receipt) {
    throw new Error("RECEIPT_NOT_FOUND");
  }

  const downloadUrl = await provider.getSignedDownloadUrl(receipt.fileUrl);

  return {
    receiptId: receipt.id,
    fileName: receipt.fileName,
    mimeType: receipt.mimeType,
    fileSize: receipt.fileSize,
    downloadUrl,
    uploadedAt: receipt.uploadedAt,
    expense: receipt.expense,
  };
}
