'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/admin/dashboard');
      } else {
        const data = await res.json();
        setError(data.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page" style={{ maxWidth: 400 }}>
      <div className="header">
        <div className="header-title">
          <img src="/logo.png" alt="학교 로고" className="school-logo" />
          <div>
            <div className="eyebrow">관리자</div>
            <h1>로그인</h1>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card">
        <div className="field" style={{ marginBottom: 16 }}>
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        {error && <div className="msg error">{error}</div>}
        <button type="submit" className="primary" disabled={loading}>
          {loading ? '확인 중...' : '로그인'}
        </button>
      </form>
    </main>
  );
}
