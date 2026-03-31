import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabasePublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      hasPostgresUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    };

    // Test database connection
    let dbTest = null;
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      const count = await prisma.report.count();
      dbTest = { 
        connection: "✅ Connected", 
        result,
        reportCount: count 
      };
    } catch (dbError) {
      dbTest = { 
        connection: "❌ Failed", 
        error: dbError instanceof Error ? dbError.message : String(dbError)
      };
    }

    // Test Supabase connection
    let supabaseTest = null;
    try {
      const { createSupabaseServerClient } = await import("@/lib/supabase");
      const supabase = createSupabaseServerClient();
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) throw error;
      supabaseTest = { connection: "✅ Connected", buckets: data?.length || 0 };
    } catch (supabaseError) {
      supabaseTest = { 
        connection: "❌ Failed", 
        error: supabaseError instanceof Error ? supabaseError.message : String(supabaseError)
      };
    }

    return NextResponse.json({
      status: "✅ Debug endpoint working",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbTest,
      supabase: supabaseTest,
      nodeEnv: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || "unknown",
    });

  } catch (error) {
    return NextResponse.json(
      {
        status: "❌ Debug endpoint failed",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}