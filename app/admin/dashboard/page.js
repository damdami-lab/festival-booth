'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DEPARTMENTS, DEPARTMENT_COLORS, TIME_SLOTS } from '@/lib/departments';

const CAPACITY = 25;

export default function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deptFilter, setDeptFilter] = useState('');
  const [slotFilter, setSlotFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const router = useRouter();

  async function loadApplications() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/list', { cache: 'no-store' });
      if (res.status === 401) {
        router.push('/admin');
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '목록을 불러오지 못했습니다.');
      } else {
        setApplications(data.applications || []);
      }
    } catch (e) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const summary = useMemo(() => {
    const map = {};
    DEPARTMENTS.forEach((d) => {
      TIME_SLOTS.forEach((t) => {
        map[`${d}_${t.id}`] = 0;
      });
    });
    applications.forEach((a) => {
      const key = `${a.department}_${a.time_slot}`;
      if (key in map) map[key] += 1;
    });
    return map;
  }, [applications]);

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (deptFilter && a.department !== deptFilter) return false;
      if (slotFilter && String(a.time_slot) !== slotFilter) return false;
      return true;
    });
  }, [applications, deptFilter, slotFilter]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((a) => selectedIds.has(a.id));

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((a) => next.delete(a.id));
      } else {
        filtered.forEach((a) => next.add(a.id));
      }
      return next;
    });
  }

  async function handleDeleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`선택한 ${ids.length}건을 삭제할까요?`)) return;

    const res = await fetch('/api/admin/delete-many', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });

    if (res.ok) {
      setApplications((prev) => prev.filter((a) => !selectedIds.has(a.id)));
      setSelectedIds(new Set());
    } else {
      alert('선택 삭제에 실패했습니다.');
    }
  }

  async function handleDelete(id) {
    if (!confirm('이 신청 내역을 삭제할까요?')) return;
    const res = await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setApplications((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } else {
      alert('삭제에 실패했습니다.');
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin');
  }

  function exportCsv() {
    const header = ['이름', '반', '번호', '과', '타임', '신청시각'];
    const rows = filtered.map((a) => [
      a.student_name,
      a.student_class,
      a.student_number,
      a.department,
      a.time_slot,
      new Date(a.created_at).toLocaleString('ko-KR'),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'booth-applications.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="page" style={{ maxWidth: 960 }}>
      <div className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="header-title">
          <img src="/logo.png" alt="학교 로고" className="school-logo" />
          <div>
            <div className="eyebrow">관리자</div>
            <h1>부스 체험 신청 현황</h1>
          </div>
        </div>
        <button className="secondary" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      {error && <div className="msg error">{error}</div>}

      <div className="summary-list">
        {DEPARTMENTS.map((d) => (
          <div key={d} className="summary-row">
            <div className="summary-dept" style={{ borderLeftColor: DEPARTMENT_COLORS[d] }}>
              {d}
            </div>
            <div className="summary-slots">
              {TIME_SLOTS.map((t) => {
                const count = summary[`${d}_${t.id}`] || 0;
                return (
                  <div key={t.id} className="summary-cell">
                    <div>{t.label}</div>
                    <div className="count">
                      {count}/{CAPACITY}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="toolbar">
        <div className="filters">
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
            <option value="">전체 과</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select value={slotFilter} onChange={(e) => setSlotFilter(e.target.value)}>
            <option value="">전체 타임</option>
            {TIME_SLOTS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.size > 0 && (
            <button className="secondary" onClick={handleDeleteSelected}>
              선택 삭제 ({selectedIds.size})
            </button>
          )}
          <button className="secondary" onClick={loadApplications}>
            새로고침
          </button>
          <button className="secondary" onClick={exportCsv}>
            CSV 다운로드
          </button>
        </div>
      </div>

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  aria-label="전체 선택"
                />
              </th>
              <th>이름</th>
              <th>반</th>
              <th>번호</th>
              <th>과</th>
              <th>타임</th>
              <th>신청시각</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr key={a.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(a.id)}
                    onChange={() => toggleSelectOne(a.id)}
                    aria-label={`${a.student_name} 선택`}
                  />
                </td>
                <td>{a.student_name}</td>
                <td>{a.student_class}</td>
                <td>{a.student_number}</td>
                <td>{a.department}</td>
                <td>{a.time_slot}타임</td>
                <td>{new Date(a.created_at).toLocaleString('ko-KR')}</td>
                <td>
                  <button className="secondary" onClick={() => handleDelete(a.id)}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#9a998f', padding: '20px 0' }}>
                  신청 내역이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </main>
  );
}
