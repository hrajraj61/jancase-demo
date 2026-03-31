import { NextResponse } from "next/server";

import { uploadBufferToSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file is required." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await uploadBufferToSupabase(Buffer.from(arrayBuffer), file.name, file.type);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Upload failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to upload file to Supabase Storage.",
      },
      { status: 500 },
    );
  }
}
