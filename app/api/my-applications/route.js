import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { hashApplicationPassword } from '@/lib/hash';

export async function POST(request) {
  const body = await request.json().catch(() => null);
  const { student_class, student_number, password } = body || {};

  if (!student_class || !student_number || !password) {
    return NextResponse.json({ error: '반, 번호, 비밀번호를 모두 입력해주세요.' }, { status: 400 });
  }

  const studentClass = Number(student_class);
  const studentNumber = Number(student_number);

  if (!Number.isInteger(studentClass) || !Number.isInteger(studentNumber)) {
    return NextResponse.json({ error: '반/번호를 다시 확인해주세요.' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('applications')
    .select('id, student_name, department, time_slot, created_at, password_hash')
    .eq('student_class', studentClass)
    .eq('student_number', studentNumber);

  if (error) {
    return NextResponse.json({ error: '조회 중 오류가 발생했습니다.' }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ error: '해당 반/번호로 신청한 내역이 없습니다.' }, { status: 404 });
  }

  const passwordHash = await hashApplicationPassword(password, studentClass, studentNumber);
  if (data[0].password_hash !== passwordHash) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 });
  }

  const applications = data.map(({ id, student_name, department, time_slot, created_at }) => ({
    id,
    student_name,
    department,
    time_slot,
    created_at,
  }));

  return NextResponse.json({ applications });
}
