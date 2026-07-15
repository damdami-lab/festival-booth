import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getOwnDepartment } from '@/lib/departments';
import { hashApplicationPassword } from '@/lib/hash';

export async function POST(request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  const { student_name, student_grade, student_class, student_number, password, selections } = body;

  if (
    !student_name ||
    !student_grade ||
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

  const studentGrade = Number(student_grade);
  const studentClass = Number(student_class);
  const studentNumber = Number(student_number);

  if (!Number.isInteger(studentGrade) || studentGrade < 1 || studentGrade > 3) {
    return NextResponse.json({ error: '학년은 1~3 사이 숫자로 입력해주세요.' }, { status: 400 });
  }
  if (!Number.isInteger(studentClass) || studentClass < 1 || studentClass > 10) {
    return NextResponse.json({ error: '반은 1~10 사이 숫자로 입력해주세요.' }, { status: 400 });
  }
  if (!Number.isInteger(studentNumber) || studentNumber < 1 || studentNumber > 40) {
    return NextResponse.json({ error: '번호를 다시 확인해주세요.' }, { status: 400 });
  }

  const seenDepartments = new Set();
  for (const sel of selections) {
    if (seenDepartments.has(sel.department)) {
      return NextResponse.json(
        { error: '같은 과는 타임이 달라도 한 번만 신청할 수 있습니다.' },
        { status: 400 }
      );
    }
    seenDepartments.add(sel.department);
  }

  const ownDept = getOwnDepartment(studentClass);
  const admin = getSupabaseAdmin();
  const passwordHash = await hashApplicationPassword(password, studentGrade, studentClass, studentNumber);

  // 이 학생(학년+반+번호)이 이전에 신청한 내역이 있으면, 그때 설정한 비밀번호와 같은지 확인.
  // 다르면 전체 요청을 거부한다 (다른 사람이 남의 학년/반/번호로 신청하는 것을 막기 위함).
  const { data: existing, error: existingError } = await admin
    .from('applications')
    .select('password_hash')
    .eq('student_grade', studentGrade)
    .eq('student_class', studentClass)
    .eq('student_number', studentNumber)
    .limit(1);

  if (existingError) {
    return NextResponse.json({ error: '신청 확인 중 오류가 발생했습니다.' }, { status: 500 });
  }

  if (existing && existing.length > 0 && existing[0].password_hash !== passwordHash) {
    return NextResponse.json(
      { error: '이미 이 학년/반/번호로 신청한 내역이 있어요. 처음 신청할 때 설정한 비밀번호를 입력해주세요.' },
      { status: 400 }
    );
  }

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
      student_grade: studentGrade,
      student_class: studentClass,
      student_number: studentNumber,
      department,
      time_slot,
      password_hash: passwordHash,
    });

    if (error) {
      let message = '신청에 실패했습니다. 다시 시도해주세요.';
      if (error.message?.includes('정원')) {
        message = '정원이 마감되었습니다.';
      } else if (error.message?.includes('applications_grade_class_number_department_key')) {
        message = '이미 같은 과에 신청한 내역이 있습니다. (같은 과는 타임이 달라도 한 번만 신청 가능)';
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
