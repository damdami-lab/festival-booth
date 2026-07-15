'use client';

import { useState } from 'react';

export default function MyApplicationsPage() {
  const [studentClass, setStudentClass] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [applications, setApplications] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLookup(e) {
    e.preventDefault();
    setError(null);
    setApplications(null);

    if (!studentClass || !studentNumber || !password) {
      setError('반, 번호, 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/my-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_class: studentClass,
          student_number: studentNumber,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '조회에 실패했습니다.');
      } else {
        setApplications(data.applications);
      }
    } catch (e) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id) {
    if (!confirm('이 신청을 취소할까요?')) return;
    try {
      const res = await fetch('/api/my-applications/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          student_class: studentClass,
          student_number: studentNumber,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '취소에 실패했습니다.');
        return;
      }
      setApplications((prev) => (prev ? prev.filter((a) => a.id !== id) : prev));
    } catch (e) {
      alert('네트워크 오류가 발생했습니다.');
    }
  }

  return (
    <main className="page" style={{ maxWidth: 640 }}>
      <div className="header">
        <div>
          <div className="eyebrow">외국어 축제</div>
          <h1>내 신청 조회 / 취소</h1>
          <p className="subtitle">신청할 때 입력한 반, 번호, 비밀번호로 본인 신청 내역을 확인할 수 있어요.</p>
        </div>
        <a href="/" className="link-button outline">
          ← 신청 페이지로
        </a>
      </div>

      <form onSubmit={handleLookup}>
        <div className="card">
          <div className="field-row">
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
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="password">비밀번호</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="신청 시 설정한 비밀번호"
              />
            </div>
          </div>
        </div>

        {error && <div className="msg error">{error}</div>}

        <button type="submit" className="primary" disabled={loading}>
          {loading ? '조회 중...' : '조회하기'}
        </button>
      </form>

      {applications && (
        <div className="card" style={{ marginTop: 20 }}>
          {applications.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#9a998f' }}>신청 내역이 없습니다.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>과</th>
                  <th>타임</th>
                  <th>신청시각</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {applications.map((a) => (
                  <tr key={a.id}>
                    <td>{a.department}</td>
                    <td>{a.time_slot}타임</td>
                    <td>{new Date(a.created_at).toLocaleString('ko-KR')}</td>
                    <td>
                      <button className="secondary" onClick={() => handleCancel(a.id)}>
                        취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </main>
  );
}
