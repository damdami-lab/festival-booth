-- 축제 부스 체험 신청 사이트 DB 스키마
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 실행하세요.

create extension if not exists pgcrypto;

create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  student_grade int not null check (student_grade between 1 and 3),
  student_class int not null check (student_class between 1 and 10),
  student_number int not null check (student_number between 1 and 40),
  department text not null check (department in ('중국어과','일본어과','독일어과','프랑스어과','스페인어과')),
  time_slot int not null check (time_slot between 1 and 4),
  created_at timestamptz not null default now(),
  password_hash text,
  unique (student_grade, student_class, student_number, time_slot)
);

-- ⬇⬇ 이미 배포되어 있던 사이트(학년 칸 추가 전)에 이 스크립트를 다시 실행할 때를 위한 마이그레이션.
-- 새로 처음 만드는 프로젝트라면 아래 블록들은 그냥 조용히 넘어가고(이미 위에서 다 반영됨), 문제 없어요.

-- 1) student_grade 컬럼이 없으면 추가 (기존 데이터는 임시로 1학년 처리 후 관리자 페이지에서 확인)
alter table applications add column if not exists student_grade int not null default 1;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'applications_student_grade_check'
  ) then
    alter table applications
      add constraint applications_student_grade_check
      check (student_grade between 1 and 3);
  end if;
end $$;

alter table applications alter column student_grade drop default;

-- 2) 기존 (반, 번호, 타임) 유일성 제약을 (학년, 반, 번호, 타임)으로 교체
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'applications_student_class_student_number_time_slot_key'
  ) then
    alter table applications
      drop constraint applications_student_class_student_number_time_slot_key;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'applications_grade_class_number_time_key'
  ) then
    alter table applications
      add constraint applications_grade_class_number_time_key
      unique (student_grade, student_class, student_number, time_slot);
  end if;
end $$;

-- 같은 학생(학년+반+번호)이 같은 과에 서로 다른 타임으로 중복 신청하는 것을 막는 제약조건
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'applications_class_number_department_key'
  ) then
    alter table applications
      drop constraint applications_class_number_department_key;
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'applications_grade_class_number_department_key'
  ) then
    alter table applications
      add constraint applications_grade_class_number_department_key
      unique (student_grade, student_class, student_number, department);
  end if;
end $$;

-- 같은 타임에 정원(25명)을 넘으면 신청을 막는 트리거
-- (advisory lock으로 동시 신청 race condition을 방지)
create or replace function check_capacity()
returns trigger as $$
declare
  current_count int;
  lock_key bigint;
begin
  lock_key := hashtextextended(new.department || '_' || new.time_slot, 0);
  perform pg_advisory_xact_lock(lock_key);

  select count(*) into current_count
  from applications
  where department = new.department and time_slot = new.time_slot;

  if current_count >= 25 then
    raise exception '정원이 마감되었습니다 (% / %타임)', new.department, new.time_slot;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_capacity on applications;
create trigger trg_check_capacity
before insert on applications
for each row execute function check_capacity();

-- 본인 과 부스는 신청하지 못하게 막는 트리거
create or replace function check_own_department()
returns trigger as $$
declare
  own_dept text;
begin
  own_dept := case
    when new.student_class in (1,2) then '중국어과'
    when new.student_class in (3,4) then '일본어과'
    when new.student_class in (5,6) then '독일어과'
    when new.student_class in (7,8) then '프랑스어과'
    when new.student_class in (9,10) then '스페인어과'
    else null
  end;

  if own_dept is not null and new.department = own_dept then
    raise exception '본인 과 부스는 신청할 수 없습니다';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_check_own_department on applications;
create trigger trg_check_own_department
before insert on applications
for each row execute function check_own_department();

-- 보안 설정: 일반 사용자는 신청(insert)만 가능하고, 데이터를 직접 조회(select)할 수는 없음
alter table applications enable row level security;

drop policy if exists "public can insert applications" on applications;
create policy "public can insert applications"
on applications
for insert
to anon
with check (true);

-- 관리자 페이지는 이 정책과 무관하게 서비스 롤 키로 접근하므로 모든 데이터를 볼 수 있음

-- 신청 폼에서 실시간 잔여 좌석을 보여주기 위한 뷰 (개인정보 없이 인원수만 노출)
create or replace view slot_counts as
select department, time_slot, count(*)::int as count
from applications
group by department, time_slot;

grant select on slot_counts to anon;
