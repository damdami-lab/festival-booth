'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEPARTMENTS, DEPARTMENT_COLORS, TIME_SLOTS, getOwnDepartment } from '@/lib/departments';

const CAPACITY = 25;

export default function ApplyPage() {
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [selections, setSelections] = useState({}); // { [time_slot]: department }
  const [counts, setCounts] = useState({}); // { "department_time_slot": count }
  const [submitting, setSubmitting] = useState(false);
  const [resultMsg, setResultMsg] = useState(null); // { type: 'error'|'success', text }

  const ownDept = useMemo(() => getOwnDepartment(studentClass), [studentClass]);

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
    if (department === ownDept) return;
    const count = counts[`${department}_${timeSlotId}`] || 0;
    const alreadySelected = selections[timeSlotId] === department;

    if (!alreadySelected && count >= CAPACITY) return;

    setSelections((prev) => {
      const next = { ...prev };
      if (alreadySelected) {
        delete next[timeSlotId];
      } else {
        next[timeSlotId] = department;
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setResultMsg(null);

    if (!studentName.trim() || !studentClass || !studentNumber || !password) {
      setResultMsg({ type: 'error', text: '이름, 반, 번호, 비밀번호를 모두 입력해주세요.' });
      return;
    }

    if (password.length < 4) {
      setResultMsg({ type: 'error', text: '비밀번호는 4자 이상으로 입력해주세요.' });
      return;
    }

    const selectionList = Object.entries(selections).map(([time_slot, department]) => ({
      time_slot: Number(time_slot),
      department,
    }));

    if (selectionList.length === 0) {
      setResultMsg({ type: 'error', text: '체험할 부스를 하나 이상 선택해주세요.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          student_class: studentClass,
          student_number: studentNumber,
          password,
          selections: selectionList,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setResultMsg({ type: 'error', text: data.error || '신청 중 오류가 발생했습니다.' });
      } else {
        const failed = data.results.filter((r) => !r.ok);
        const succeeded = data.results.filter((r) => r.ok);

        if (failed.length === 0) {
          setResultMsg({ type: 'success', text: '신청이 완료되었습니다!' });
          setSelections({});
        } else if (succeeded.length > 0) {
          setResultMsg({
            type: 'error',
            text: `일부만 신청되었습니다. 실패: ${failed
              .map((f) => `${f.time_slot}타임(${f.message})`)
              .join(', ')}`,
          });
          setSelections({});
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
              타임마다 원하는 과의 부스를 하나씩 골라 신청할 수 있어요. (본인 과는 선택 불가, 타임별
              정원 {CAPACITY}명)
            </p>
          </div>
        </div>
        <a href="/my-applications" className="link-button">
          내 신청 확인·취소
        </a>
      </div>

      <form onSubmit={handleSubmit}>
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
                placeholder="숫자 4자 이상 (신청 조회/취소 시 필요)"
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
                      const selected = selections[t.id] === dept;
                      const disabled = isOwn || (full && !selected);

                      return (
                        <td
                          key={t.id}
                          className={`slot-cell ${disabled ? 'disabled' : ''}`}
                          onClick={() => !disabled && toggleCell(dept, t.id)}
                          style={
                            selected
                              ? { background: DEPARTMENT_COLORS[dept], color: '#fff' }
                              : undefined
                          }
                        >
                          {selected ? '선택됨' : isOwn ? '-' : full ? '마감' : '선택'}
                          {!isOwn && (
                            <span
                              className="slot-count"
                              style={selected ? { color: '#fff' } : undefined}
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

        {resultMsg && <div className={`msg ${resultMsg.type}`}>{resultMsg.text}</div>}

        <button type="submit" className="primary" disabled={submitting}>
          {submitting ? '신청 중...' : '신청하기'}
        </button>
      </form>

      <p className="footer-note">
        문의사항이 있으면 담당 선생님 또는 학생회로 연락해주세요.
      </p>
    </main>
  );
}
