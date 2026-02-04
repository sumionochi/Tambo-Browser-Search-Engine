// app/api/collections/[id]/items/[itemId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/utils/sync-user";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user: supabaseUser },
    } = await supabase.auth.getUser();

    if (!supabaseUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prismaUser = await ensureUserExists(supabaseUser);

    // Verify ownership
    const collection = await prisma.collection.findUnique({
      where: { id: params.id },
    });

    if (!collection) {
      return NextResponse.json(
        { error: "Collection not found" },
        { status: 404 }
      );
    }

    if (collection.userId !== prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Remove item from collection
    const items = (collection.items as any[]) || [];
    const updatedItems = items.filter((item: any) => item.id !== params.itemId);

    await prisma.collection.update({
      where: { id: params.id },
      data: { items: updatedItems as any },
    });

    console.log("🗑️ Deleted item from collection:", params.itemId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete collection item error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete item" },
      { status: 500 }
    );
  }
}
