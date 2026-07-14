export const DEPARTMENTS = ['중국어과', '일본어과', '독일어과', '프랑스어과', '스페인어과'];

export const DEPARTMENT_COLORS = {
  중국어과: '#C1502E',
  일본어과: '#C98A1B',
  독일어과: '#1F7A6C',
  프랑스어과: '#7A3B69',
  스페인어과: '#35558C',
};

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
