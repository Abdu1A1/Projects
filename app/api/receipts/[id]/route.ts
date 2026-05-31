import { NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth";
import { deleteReceipt, getReceipt, saveCategoryCorrection, updateReceipt } from "@/lib/data/repository";
import { receiptPatchSchema } from "@/lib/validators";

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    const payload = receiptPatchSchema.parse(await request.json());
    const current = await getReceipt(user.id, params.id);

    if (!current) {
      return NextResponse.json({ error: "Receipt not found." }, { status: 404 });
    }

    if (payload.category && payload.category !== payload.originalCategory) {
      await saveCategoryCorrection({
        userId: user.id,
        merchant: current.merchant,
        originalCategory: payload.originalCategory ?? current.category,
        correctedCategory: payload.category,
      });
    }

    const receipt = await updateReceipt({
      userId: user.id,
      receiptId: params.id,
      patch: {
        ...payload,
        tags: payload.tags,
        line_items: payload.line_items,
      },
    });

    return NextResponse.json({ receipt });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 });
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireApiUser();
    await deleteReceipt(user.id, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 });
  }
}
