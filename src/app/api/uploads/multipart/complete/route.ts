import { NextRequest, NextResponse } from "next/server";
import { finishMultipartUpload } from "@/lib/storage/r2";

type MultipartPart = {
  partNumber: number;
  etag: string;
};

function isMultipartPart(value: unknown): value is MultipartPart {
  if (!value || typeof value !== "object") return false;

  const part = value as Record<string, unknown>;

  return (
    typeof part.partNumber === "number" &&
    Number.isInteger(part.partNumber) &&
    part.partNumber >= 1 &&
    typeof part.etag === "string" &&
    part.etag.length > 0
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;

    const key = typeof body.key === "string" ? body.key : "";
    const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";

    const rawParts = Array.isArray(body.parts) ? body.parts : [];

    if (!key || !uploadId || rawParts.length === 0) {
      return NextResponse.json(
        { error: "Missing multipart completion data" },
        { status: 400 },
      );
    }

    const parts: MultipartPart[] = [];

    for (const part of rawParts) {
      if (!isMultipartPart(part)) {
        return NextResponse.json(
          { error: "Invalid multipart parts" },
          { status: 400 },
        );
      }

      parts.push(part);
    }

    return NextResponse.json(
      await finishMultipartUpload({
        key,
        uploadId,
        parts,
      }),
    );
  } catch (error) {
    console.error("uploads.multipart.complete", error);

    return NextResponse.json(
      { error: "Could not complete multipart upload" },
      { status: 500 },
    );
  }
}
