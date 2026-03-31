import { createClient } from "@supabase/supabase-js";

function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  }

  return url;
}

function getSupabaseKey() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  if (publishableKey) {
    return publishableKey;
  }

  throw new Error("No Supabase key is configured.");
}

export function getStorageBucketName() {
  return process.env.SUPABASE_STORAGE_BUCKET || "reports";
}

export function createSupabaseServerClient() {
  return createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function uploadBufferToSupabase(buffer: Buffer, fileName: string, mimeType: string) {
  const supabase = createSupabaseServerClient();
  const bucket = getStorageBucketName();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-");
  const objectPath = `reports/${Date.now()}-${crypto.randomUUID()}-${safeName}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(objectPath, buffer, {
      contentType: mimeType || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);

  return {
    path: objectPath,
    bucket,
    url: data.publicUrl,
  };
}
