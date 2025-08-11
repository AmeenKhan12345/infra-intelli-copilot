// src/app/api/complaints/route.ts

import { supabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const complaintSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  file: z.instanceof(File),
});

export async function POST(request: Request) {
  console.log("✅ API Route /api/complaints hit!");

  try {
    const form = await request.formData();
    console.log("📄 Received form data.");

    // --- 1. Validate Form Data ---
    const parsed = complaintSchema.safeParse({
      title: form.get("title"),
      description: form.get("description"),
      latitude: form.get("latitude"),
      longitude: form.get("longitude"),
      file: form.get("file"),
    });

    if (!parsed.success) {
      // This error will now be more specific on the frontend
      console.error("❌ Zod Validation Failed:", parsed.error.flatten());
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    console.log("👍 Validation successful.");

    const { title, description, latitude, longitude, file } = parsed.data;

    // --- 2. Handle Image Upload ---
    const bucket = "issues";
    const fileExtension = file.name.split(".").pop();
    const path = `public/${Date.now()}-${Math.random()}.${fileExtension}`;
    
    console.log(`🚀 Uploading image to bucket: ${bucket}, path: ${path}`);
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file);

    if (uploadError) {
      // Log the detailed Supabase error to the backend console
      console.error("❌ Supabase Storage Error:", uploadError);
      throw new Error(uploadError.message);
    }
    console.log("🖼️ Image upload successful.");

    // --- 3. Get Public URL for the Image ---
    const { data: urlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(uploadData.path);
    const imageUrl = urlData.publicUrl;
    console.log(`🔗 Image URL: ${imageUrl}`);

    // --- 4. Prepare data for insertion ---
    const complaintToInsert = {
      title,
      description,
      latitude,
      longitude,
      img_url: imageUrl,
      category: "Uncategorized",
      severity: "Medium",
      status: "new",
    };
    console.log("💾 Preparing to insert data:", complaintToInsert);

    // --- 5. Insert into Database ---
    const { data: newComplaint, error: dbError } = await supabaseAdmin
      .from("issues")
      .insert(complaintToInsert)
      .select()
      .single();

    if (dbError) {
      // Log the detailed Supabase error to the backend console
      console.error("❌ Supabase Database Error:", dbError);
      throw new Error(dbError.message);
    }
    console.log("🎉 Complaint inserted successfully:", newComplaint);

    // --- 6. Success! ---
    return NextResponse.json(newComplaint);

  } catch (err: any) {
    // This catches any errors thrown in the try block
    console.error("🔥 UNEXPECTED SERVER ERROR:", err);
    return NextResponse.json({ error: { message: err.message || "An unexpected server error occurred." } }, { status: 500 });
  }
}