import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerAccessWhere, getProductMarketWhere } from "@/lib/division";
import { deleteFromS3, getPresignedUrl } from "@/lib/s3";

async function canAccessAttachment(
  attachment: { customerId: string | null; productId: string | null },
  role: string,
  userId: string,
  division: string | null | undefined
): Promise<boolean> {
  if (attachment.customerId) {
    const c = await prisma.customer.findFirst({
      where: { id: attachment.customerId, ...getCustomerAccessWhere(role, userId, division) },
      select: { id: true },
    });
    return !!c;
  }
  if (attachment.productId) {
    const p = await prisma.product.findFirst({
      where: { id: attachment.productId, ...getProductMarketWhere(role, division) },
      select: { id: true },
    });
    return !!p;
  }
  return false;
}

/** Redirects to a short-lived presigned S3 URL (bucket objects are private). */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const allowed = await canAccessAttachment(attachment, role, userId, division);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const url = await getPresignedUrl(attachment.s3Key);
  return NextResponse.redirect(url);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const allowed = await canAccessAttachment(attachment, role, userId, division);
  if (!allowed) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await deleteFromS3(attachment.s3Key);
  await prisma.attachment.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
