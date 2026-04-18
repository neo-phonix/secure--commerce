import { NextResponse } from 'next/server';

export async function GET() {
  const env = Object.keys(process.env).sort();
  const supabase = env.filter(k => k.toUpperCase().includes('SUPABASE') || k.toUpperCase().includes('SERVICE') || k.toUpperCase().includes('KEY') || k.toUpperCase().includes('URL'));
  
  return NextResponse.json({
    envCount: env.length,
    supabaseRelatedKeys: supabase,
    // Redacted values for safety
    valuesPresent: supabase.reduce((acc, key) => {
      const val = process.env[key];
      acc[key] = {
        exists: !!val,
        length: val?.length || 0,
        startsWith: val?.substring(0, 5) + '...',
        endsWith: '...' + val?.substring(val?.length - 5)
      };
      return acc;
    }, {} as any)
  });
}
