import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  const { data, error } = await supabase.from('slot_counts').select('*');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    { counts: data || [] },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
      },
    }
  );
}
