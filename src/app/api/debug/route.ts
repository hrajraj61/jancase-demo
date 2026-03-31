import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Skip database operations during build
    const isBuildTime = process.env.NODE_ENV === "production" && !process.env.VERCEL_URL;
    
    // Check environment variables
    const envCheck = {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabasePublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      hasPostgresUrl: !!process.env.POSTGRES_PRISMA_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isBuildTime,
    };

    // Test database connection (skip during build)
    let dbTest = null;
    if (!isBuildTime) {
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
    } else {
      dbTest = { connection: "⏭️ Skipped during build" };
    }

    // Test Supabase connection (skip during build)
    let supabaseTest = null;
    if (!isBuildTime) {
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
    } else {
      supabaseTest = { connection: "⏭️ Skipped during build" };
    }

    return NextResponse.json({
      status: "✅ Debug endpoint working",
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbTest,
      supabase: supabaseTest,
      nodeEnv: process.env.NODE_ENV,
      region: process.env.VERCEL_REGION || "unknown",
      buildTime: isBuildTime,
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