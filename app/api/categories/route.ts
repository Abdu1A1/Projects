import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { createCategory } from "@/lib/data/repository";

export async function POST(request: Request) {
  try {
    const user = await requireApiUser();
    const payload = (await request.json()) as { name?: string };
    if (!payload.name?.trim()) {
      return NextResponse.json({ error: "Category name is required." }, { status: 400 });
    }
    const category = await createCategory(user.id, payload.name.trim());
    return NextResponse.json({ category });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create category.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
