import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const customerId = formData.get("customerId") as string | null;
  const productId = formData.get("productId") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!customerId && !productId) {
    return NextResponse.json(
      { error: "Either customerId or productId is required" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = file.name.split(".").pop();
  const key = `${customerId ? `customers/${customerId}` : `products/${productId}`}/${uuidv4()}.${ext}`;

  const s3Url = await uploadToS3(key, buffer, file.type);

  const attachment = await prisma.attachment.create({
    data: {
      customerId,
      productId,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      s3Key: key,
      s3Url,
      uploadedBy: session.user?.id,
    },
  });

  return NextResponse.json(attachment, { status: 201 });
}
