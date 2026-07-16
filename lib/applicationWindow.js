// 신청 접수 기간 설정
// 이 시간 범위 안에서만 학생들이 부스를 신청할 수 있어요.
// 시간은 한국 시간(Asia/Seoul, UTC+9) 기준이라, 서버가 어느 시간대에서 돌아가든 정확히 동작해요.

export const APPLICATION_OPEN = '2026-07-17T12:00:00+09:00';
export const APPLICATION_CLOSE = '2026-07-17T13:00:00+09:00';

/**
 * 지금 시각(now)이 신청 기간 전/중/후 중 어디인지 알려줘요.
 * @param {Date} now
 * @returns {{ status: 'before' | 'open' | 'after', open: Date, close: Date }}
 */
export function getApplicationWindowStatus(now = new Date()) {
  const open = new Date(APPLICATION_OPEN);
  const close = new Date(APPLICATION_CLOSE);

  if (now < open) {
    return { status: 'before', open, close };
  }
  if (now > close) {
    return { status: 'after', open, close };
  }
  return { status: 'open', open, close };
}

export function isApplicationOpen(now = new Date()) {
  return getApplicationWindowStatus(now).status === 'open';
}

/**
 * ISO 문자열을 "2026년 7월 13일 오후 12:00" 같은 한국어 날짜로 보여줘요.
 */
export function formatKoreanDateTime(iso) {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}
