// app/api/notes/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/utils/sync-user";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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
    const note = await prisma.note.findUnique({
      where: { id: params.id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.userId !== prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete note
    await prisma.note.delete({
      where: { id: params.id },
    });

    console.log("🗑️ Deleted note:", params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete note error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}

// ✨ NEW: PATCH endpoint for updating note content
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
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
    const body = await request.json();

    // Verify ownership
    const note = await prisma.note.findUnique({
      where: { id: params.id },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    if (note.userId !== prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update note
    const updatedNote = await prisma.note.update({
      where: { id: params.id },
      data: {
        ...(body.content !== undefined && { content: body.content }),
        ...(body.sourceSearch !== undefined && {
          sourceSearch: body.sourceSearch,
        }),
        ...(body.linkedCollectionId !== undefined && {
          linkedCollectionId: body.linkedCollectionId,
        }),
      },
    });

    console.log("✏️ Updated note:", params.id);

    return NextResponse.json({
      success: true,
      note: {
        id: updatedNote.id,
        content: updatedNote.content,
        sourceSearch: updatedNote.sourceSearch,
        linkedCollection: updatedNote.linkedCollectionId,
        createdAt: updatedNote.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Update note error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update note" },
      { status: 500 }
    );
  }
}
