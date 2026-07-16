'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEPARTMENTS, DEPARTMENT_COLORS, TIME_SLOTS, getOwnDepartment, getContrastTextColor } from '@/lib/departments';
import { getApplicationWindowStatus, formatKoreanDateTime, APPLICATION_OPEN, APPLICATION_CLOSE } from '@/lib/applicationWindow';

const CAPACITY = 25;

function formatCountdown(ms) {
  if (ms <= 0) return '0초';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts = [];
  if (h > 0) parts.push(`${h}시간`);
  if (h > 0 || m > 0) parts.push(`${m}분`);
  parts.push(`${s}초`);
  return parts.join(' ');
}

export default function ApplyPage() {
  const [studentName, setStudentName] = useState('');
  const [studentGrade, setStudentGrade] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selection, setSelection] = useState(null); // { time_slot, department } | null
  const [counts, setCounts] = useState({}); // { "department_time_slot": count }
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState(null); // { type: 'error'|'success', text }
  const [now, setNow] = useState(() => new Date());

  const ownDept = useMemo(() => getOwnDepartment(studentClass), [studentClass]);

  // 1초마다 현재 시각을 갱신해서 신청 기간 배너/카운트다운을 실시간으로 보여줌
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const windowStatus = useMemo(() => getApplicationWindowStatus(now), [now]);
  const isOpen = windowStatus.status === 'open';

  const allFull = useMemo(() => {
    return DEPARTMENTS.every((d) =>
      TIME_SLOTS.every((t) => (counts[`${d}_${t.id}`] || 0) >= CAPACITY)
    );
  }, [counts]);

  async function loadCounts() {
    try {
      const res = await fetch('/api/counts', { cache: 'no-store' });
      const data = await res.json();
      const map = {};
      (data.counts || []).forEach((c) => {
        map[`${c.department}_${c.time_slot}`] = c.count;
      });
      setCounts(map);
    } catch (e) {
      // 조용히 무시 - 잔여 좌석 표시만 안 될 뿐 신청 자체는 서버에서 다시 검증됨
    }
  }

  useEffect(() => {
    loadCounts();
  }, []);

  function toggleCell(department, timeSlotId) {
    if (!isOpen) return;
    if (department === ownDept) return;

    const alreadySelected =
      selection && selection.time_slot === timeSlotId && selection.department === department;

    if (alreadySelected) {
      setSelection(null);
      return;
    }

    const count = counts[`${department}_${timeSlotId}`] || 0;
    if (count >= CAPACITY) return;

    // 딱 하나만 신청 가능하므로, 다른 칸을 누르면 이전 선택은 자동으로 바뀜
    setSelection({ time_slot: timeSlotId, department });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResultMsg(null);

    if (!isOpen) {
      setResultMsg({
        type: 'error',
        text:
          windowStatus.status === 'before'
            ? `아직 신청 기간이 아닙니다. ${formatKoreanDateTime(APPLICATION_OPEN)}부터 신청할 수 있어요.`
            : '신청 기간이 종료되었습니다.',
      });
      return;
    }

    if (!studentName.trim() || !studentGrade || !studentClass || !studentNumber || !password) {
      setResultMsg({ type: 'error', text: '이름, 학년, 반, 번호, 비밀번호를 모두 입력해주세요.' });
      return;
    }

    if (password.length < 4) {
      setResultMsg({ type: 'error', text: '비밀번호는 4자 이상으로 입력해주세요.' });
      return;
    }

    if (!selection) {
      setResultMsg({ type: 'error', text: '체험할 부스를 하나 선택해주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_grade: studentGrade,
          student_class: studentClass,
          student_number: studentNumber,
          password,
          selections: [selection],
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResultMsg({ type: 'error', text: data.error || '신청 중 오류가 발생했습니다.' });
      } else {
        const failed = data.results.filter((r) => !r.ok);

        if (failed.length === 0) {
          setResultMsg({ type: 'success', text: '신청이 완료되었습니다!' });
          setSelection(null);
        } else {
          setResultMsg({
            type: 'error',
            text: failed.map((f) => f.message).join(' / '),
          });
        }
      }
      loadCounts();
    } catch (err) {
      setResultMsg({ type: 'error', text: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div className="header">
        <div className="header-title">
          <img src="/logo.png" alt="학교 로고" className="school-logo" />
          <div>
            <div className="eyebrow">한영외국어고등학교 문화제</div>
            <h1>부스 체험 신청</h1>
            <p className="subtitle">
              본인 과 부스를 제외한 부스 중 딱 하나만 골라 신청할 수 있어요. (타임별 정원 {CAPACITY}명)
            </p>
          </div>
        </div>
        <a href="/my-applications" className="link-button">
          내 신청 확인·취소
        </a>
      </div>

      {windowStatus.status === 'before' && (
        <div className="msg error">
          아직 신청 기간이 아닙니다. <strong>{formatKoreanDateTime(APPLICATION_OPEN)}</strong>부터{' '}
          <strong>{formatKoreanDateTime(APPLICATION_CLOSE)}</strong>까지 신청할 수 있어요.
          <br />
          (신청 시작까지 {formatCountdown(windowStatus.open - now)} 남았어요)
        </div>
      )}
      {windowStatus.status === 'after' && (
        <div className="msg error">
          신청이 마감되었습니다. (신청 기간: {formatKoreanDateTime(APPLICATION_OPEN)} ~{' '}
          {formatKoreanDateTime(APPLICATION_CLOSE)})
        </div>
      )}
      {isOpen && (
        <div className="msg success">
          지금 신청할 수 있어요! (신청 마감까지 {formatCountdown(windowStatus.close - now)} 남았어요)
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {allFull && (
          <div className="msg error">
            모든 타임의 정원이 마감되어 더 이상 신청을 받지 않습니다.
          </div>
        )}
        <div className="card">
          <div className="field-row">
            <div className="field" style={{ flex: 2 }}>
              <label htmlFor="name">이름</label>
              <input
                id="name"
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="홍길동"
                disabled={!isOpen}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="grade">학년</label>
              <input
                id="grade"
                type="number"
                min="1"
                max="3"
                value={studentGrade}
                onChange={(e) => setStudentGrade(e.target.value)}
                placeholder="1~3"
                disabled={!isOpen}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="class">반</label>
              <input
                id="class"
                type="number"
                min="1"
                max="10"
                value={studentClass}
                onChange={(e) => setStudentClass(e.target.value)}
                placeholder="1~10"
                disabled={!isOpen}
              />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="number">번호</label>
              <input
                id="number"
                type="number"
                min="1"
                max="40"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                placeholder="번호"
                disabled={!isOpen}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="4자 이상 (신청 조회/취소 시 필요)"
                disabled={!isOpen}
              />
            </div>
          </div>
          <p className="footer-note" style={{ marginTop: 0 }}>
            나중에 신청 내역을 조회하거나 취소할 때 필요하니 잊지 않게 기억해두세요.
          </p>
          {ownDept && (
            <p className="footer-note" style={{ marginTop: 0 }}>
              본인 소속: <strong>{ownDept}</strong> (선택 목록에서 회색으로 표시돼요)
            </p>
          )}
        </div>

        <div className="card">
          <table className="matrix">
            <thead>
              <tr>
                <th className="dept-label">과 \ 타임</th>
                {TIME_SLOTS.map((t) => (
                  <th key={t.id}>
                    {t.label}
                    <br />
                    {t.time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEPARTMENTS.map((dept) => {
                const isOwn = dept === ownDept;
                return (
                  <tr key={dept} className={isOwn ? 'own-dept-row' : ''}>
                    <td className="dept-label">
                      <span
                        className="dept-tag"
                        style={{ background: DEPARTMENT_COLORS[dept] }}
                      />
                      {dept}
                      {isOwn && ' (본인 과)'}
                    </td>
                    {TIME_SLOTS.map((t) => {
                      const count = counts[`${dept}_${t.id}`] || 0;
                      const full = count >= CAPACITY;
                      const selected =
                        selection && selection.time_slot === t.id && selection.department === dept;
                      const disabled = !isOpen || isOwn || (full && !selected);

                      return (
                        <td
                          key={t.id}
                          className={`slot-cell ${disabled ? 'disabled' : ''}`}
                          onClick={() => !disabled && toggleCell(dept, t.id)}
                          style={
                            selected
                              ? {
                                  background: DEPARTMENT_COLORS[dept],
                                  color: getContrastTextColor(DEPARTMENT_COLORS[dept]),
                                  border: '2px solid #1c1c1a',
                                  fontWeight: 600,
                                }
                              : undefined
                          }
                        >
                          {selected ? '선택됨' : isOwn ? '-' : full ? '마감' : '선택'}
                          {!isOwn && (
                            <span
                              className="slot-count"
                              style={
                                selected
                                  ? { color: getContrastTextColor(DEPARTMENT_COLORS[dept]) }
                                  : undefined
                              }
                            >
                              {count}/{CAPACITY}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="footer-note" style={{ marginTop: 0 }}>
          {selection
            ? `선택함: ${selection.department} / ${TIME_SLOTS.find((t) => t.id === selection.time_slot)?.label}`
            : '아직 선택한 부스가 없어요.'}
        </p>

        {resultMsg && <div className={`msg ${resultMsg.type}`}>{resultMsg.text}</div>}

        <button type="submit" className="primary" disabled={submitting || allFull || !isOpen}>
          {!isOpen ? '신청 기간이 아닙니다' : allFull ? '신청 마감' : submitting ? '신청 중...' : '신청하기'}
        </button>
      </form>

      <p className="footer-note">
        문의사항이 있으면 담당 선생님 또는 축제 준비 위원회로 연락해주세요.
      </p>
    </main>
  );
}
