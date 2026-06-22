import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireActiveUser, hasRole } from "@/lib/require-user";
import { recordAudit } from "@/lib/audit";
import { CatalogItem } from "@/models/catalog-item";

const schema = z.object({ type: z.enum(["SERVICE", "LEAD_SOURCE"]), name: z.string().trim().min(1), active: z.boolean().optional().default(true) });

export async function GET(request: NextRequest) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = request.nextUrl.searchParams.get("type");
  const filter = type && ["SERVICE", "LEAD_SOURCE"].includes(type) ? { type } : {};
  return NextResponse.json({ items: await CatalogItem.find(filter).sort({ sortOrder: 1, name: 1 }).lean() });
}

export async function POST(request: Request) {
  const user = await requireActiveUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasRole(user.role, "SUPER_ADMIN")) return NextResponse.json({ error: "Super Admin access required" }, { status: 403 });
  try {
    const input = schema.parse(await request.json());
    const item = await CatalogItem.create({ ...input, createdBy: user.sub });
    await recordAudit({ actorId: user.sub, actorName: user.name, action: "CREATED_CATALOG_ITEM", targetType: input.type, targetId: item.id, after: input });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Catalog validation failed", issues: error.issues }, { status: 400 });
    return NextResponse.json({ error: "Unable to create catalog item" }, { status: 500 });
  }
}
