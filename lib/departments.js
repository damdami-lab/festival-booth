export const DEPARTMENTS = ['중국어과', '일본어과', '독일어과', '프랑스어과', '스페인어과'];

export const DEPARTMENT_COLORS = {
  중국어과: '#D32F2F',
  일본어과: '#FFFFFF',
  독일어과: '#000000',
  프랑스어과: '#2E5090',
  스페인어과: '#F5811F',
};

// 배경색이 밝을 때(예: 흰색)는 검정 글씨, 어두울 때는 흰 글씨를 쓰기 위한 헬퍼
export function getContrastTextColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#1c1c1a' : '#ffffff';
}

export const TIME_SLOTS = [
  { id: 1, label: '1타임', time: '13:00-13:25' },
  { id: 2, label: '2타임', time: '13:30-13:55' },
  { id: 3, label: '3타임', time: '14:00-14:25' },
  { id: 4, label: '4타임', time: '14:30-14:55' },
];

// 반 번호로 본인 소속 과를 계산
export function getOwnDepartment(studentClass) {
  const c = Number(studentClass);
  if (c === 1 || c === 2) return '중국어과';
  if (c === 3 || c === 4) return '일본어과';
  if (c === 5 || c === 6) return '독일어과';
  if (c === 7 || c === 8) return '프랑스어과';
  if (c === 9 || c === 10) return '스페인어과';
  return null;
}
