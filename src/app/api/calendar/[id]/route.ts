// app/api/calendar/[id]/route.ts
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
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.userId !== prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete event
    await prisma.calendarEvent.delete({
      where: { id: params.id },
    });

    console.log("🗑️ Deleted calendar event:", params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete event" },
      { status: 500 }
    );
  }
}

// ✨ NEW: PATCH endpoint for updating events
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
    const event = await prisma.calendarEvent.findUnique({
      where: { id: params.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.userId !== prismaUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update event
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: params.id },
      data: {
        ...(body.title !== undefined && { title: body.title }),
        ...(body.datetime !== undefined && {
          datetime: new Date(body.datetime),
        }),
        ...(body.note !== undefined && { note: body.note }),
        ...(body.completed !== undefined && { completed: body.completed }),
        ...(body.linkedCollectionId !== undefined && {
          linkedCollectionId: body.linkedCollectionId,
        }),
      },
    });

    console.log("✏️ Updated calendar event:", params.id);

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        title: updatedEvent.title,
        datetime: updatedEvent.datetime.toISOString(),
        note: updatedEvent.note,
        completed: updatedEvent.completed,
        linkedCollection: updatedEvent.linkedCollectionId,
        createdAt: updatedEvent.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update event" },
      { status: 500 }
    );
  }
}
