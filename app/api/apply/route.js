import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getOwnDepartment } from '@/lib/departments';
import { hashApplicationPassword } from '@/lib/hash';

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { student_name, student_class, student_number, password, selections } = body;

  if (
    !student_name ||
    !student_class ||
    !student_number ||
    !password ||
    !Array.isArray(selections) ||
    selections.length === 0
  ) {
    return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 });
  }

  if (String(password).length < 4) {
    return NextResponse.json({ error: '비밀번호는 4자 이상으로 입력해주세요.' }, { status: 400 });
  }

  const studentClass = Number(student_class);
  const studentNumber = Number(student_number);

  if (!Number.isInteger(studentClass) || studentClass < 1 || studentClass > 10) {
    return NextResponse.json({ error: '반은 1~10 사이 숫자로 입력해주세요.' }, { status: 400 });
  }
  if (!Number.isInteger(studentNumber) || studentNumber < 1 || studentNumber > 40) {
    return NextResponse.json({ error: '번호를 다시 확인해주세요.' }, { status: 400 });
  }

  const ownDept = getOwnDepartment(studentClass);
  const admin = getSupabaseAdmin();
  const passwordHash = await hashApplicationPassword(password, studentClass, studentNumber);

  // 이 학생(반+번호)이 이전에 신청한 내역이 있으면, 그때 설정한 비밀번호와 같은지 확인.
  // 다르면 전체 요청을 거부한다 (다른 사람이 남의 반/번호로 신청하는 것을 막기 위함).
  const { data: existing, error: existingError } = await admin
    .from('applications')
    .select('password_hash')
    .eq('student_class', studentClass)
    .eq('student_number', studentNumber)
    .limit(1);

  if (existingError) {
    return NextResponse.json({ error: '신청 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }

  if (existing && existing.length > 0 && existing[0].password_hash !== passwordHash) {
    return NextResponse.json(
      { error: '이미 이
