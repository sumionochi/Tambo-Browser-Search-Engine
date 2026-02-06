// lib/auth-helpers.ts
// Shared auth helper for API routes — extracts authenticated user from Supabase session

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function getUserFromRequest() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !supabaseUser) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });

  return user;
}
