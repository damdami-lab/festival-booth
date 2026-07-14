# 외국어 축제 부스 체험 신청 사이트

학생이 부스 체험 시간을 신청하는 페이지(`/`)와, 신청 현황을 관리하는 관리자 페이지(`/admin`)로 구성된
Next.js + Supabase 프로젝트입니다.

## 규칙 요약
- 반 배정: 1·2반 = 중국어과, 3·4반 = 일본어과, 5·6반 = 독일어과, 7·8반 = 프랑스어과, 9·10반 = 스페인어과
- 본인 소속 과 부스는 신청 불가 (자동으로 막힘)
- 한 타임에는 한 곳만 신청 가능, 서로 다른 타임에는 여러 번 신청 가능
- 타임별 정원 25명, 정원이 차면 자동으로 마감 처리

---

## 1단계. Supabase 설정

1. [supabase.com](https://supabase.com) 에서 무료 계정을 만들고 새 프로젝트를 생성하세요.
2. 프로젝트가 만들어지면 왼쪽 메뉴의 **SQL Editor** 로 들어가서, 이 폴더에 있는 `supabase.sql` 파일의
   내용을 전부 복사해서 붙여넣고 **Run** 을 누르세요. (테이블, 정원 체크, 본인 과 제외 로직이 전부 이 안에 있어요)
3. 왼쪽 메뉴 **Project Settings > API** 로 들어가서 아래 3가지 값을 복사해두세요.
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 외부에 공개하면 안 되는 키예요)

## 2단계. GitHub에 올리기

1. GitHub에서 새 저장소(repository)를 만드세요. (Public/Private 상관없음)
2. 이 폴더를 그 저장소에 push 합니다. 터미널을 쓸 수 있다면:
   ```bash
   cd festival-booth
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin <내 저장소 주소>
   git push -u origin main
   ```
   터미널이 낯설다면 GitHub Desktop 앱으로도 동일하게 할 수 있어요.

## 3단계. Vercel로 배포하기

1. [vercel.com](https://vercel.com) 에 GitHub 계정으로 로그인하세요.
2. **Add New > Project** 에서 방금 만든 GitHub 저장소를 선택하고 Import 하세요.
3. **Environment Variables** 항목에 아래 5개를 추가하세요. (`.env.example` 참고)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `ADMIN_PASSWORD` (관리자 페이지 로그인 비밀번호, 원하는 값으로)
   - `ADMIN_SESSION_SECRET` (아무 긴 임의의 문자열, 예: 랜덤 문자열 생성기로 만든 32자 이상 문자열)
4. **Deploy** 를 누르면 몇 분 안에 사이트가 배포됩니다.
5. 이후 GitHub 저장소에 코드를 push 할 때마다 Vercel이 자동으로 다시 배포해줘요.

배포가 끝나면:
- `https://내프로젝트.vercel.app` → 학생용 신청 페이지
- `https://내프로젝트.vercel.app/admin` → 관리자 로그인 페이지

## 로컬에서 미리 확인해보기 (선택)

```bash
npm install
cp .env.example .env.local   # 그 다음 .env.local 파일을 열어 실제 값으로 채우기
npm run dev
```
브라우저에서 `http://localhost:3000` 접속.

## 파일 구조
```
app/page.js                  학생 신청 폼
app/admin/page.js            관리자 로그인
app/admin/dashboard/page.js  관리자 대시보드 (목록, 필터, CSV 다운로드, 삭제)
app/api/apply                신청 처리 API
app/api/counts                실시간 잔여 좌석 API
app/api/admin/*               관리자 전용 API (로그인/목록/삭제)
lib/departments.js            반-과 매핑, 타임 정보
supabase.sql                  데이터베이스 스키마 (테이블, 정원/본인과 검증 트리거)
```

## 나중에 바꾸고 싶을 수 있는 것들
- 정원 25명 → `supabase.sql`의 `check_capacity` 함수 안 숫자와, `app/page.js`·`app/admin/dashboard/page.js`의 `CAPACITY` 값을 같이 수정
- 반-과 매핑 → `lib/departments.js`의 `getOwnDepartment` 함수
- 타임 시간표 → `lib/departments.js`의 `TIME_SLOTS`
