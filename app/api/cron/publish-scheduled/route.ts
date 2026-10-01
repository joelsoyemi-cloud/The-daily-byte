import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("publish_due_scheduled_posts");

  if (error) {
    return NextResponse.json({ error: "Scheduled publishing is temporarily unavailable." }, { status: 500 });
  }

  return NextResponse.json({ published: data?.length ?? 0, posts: data });
}
