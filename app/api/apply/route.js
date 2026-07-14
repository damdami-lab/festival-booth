import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getOwnDepartment } from '@/lib/departments';

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { student_name, student_class, student_number, selections } = body;

  if (
    !student_name ||
    !student_class ||
    !student_number ||
    !Array.isArray(selections) ||
    selections.length === 0
  ) {
    return NextResponse.json({ error: '입력값을 확인해주세요.' }, { status: 400 });
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
  const results = [];

  for (const sel of selections) {
    const { department, time_slot } = sel;

    if (department === ownDept) {
      results.push({
        time_slot,
        department,
        ok: false,
        message: '본인 과 부스는 신청할 수 없습니다.',
      });
      continue;
    }

    const { error } = await admin.from('applications').insert({
      student_name: String(student_name).trim(),
      student_class: studentClass,
      student_number: studentNumber,
      department,
      time_slot,
    });

    if (error) {
      let message = '신청에 실패했습니다. 다시 시도해주세요.';
      if (error.message?.includes('정원')) {
        message = '정원이 마감되었습니다.';
      } else if (error.code === '23505') {
        message = '이미 같은 타임에 신청한 내역이 있습니다.';
      } else if (error.message?.includes('본인 과')) {
        message = '본인 과 부스는 신청할 수 없습니다.';
      }
      results.push({ time_slot, department, ok: false, message });
    } else {
      results.push({ time_slot, department, ok: true });
    }
  }

  const anySuccess = results.some((r) => r.ok);
  return NextResponse.json({ ok: anySuccess, results });
}
