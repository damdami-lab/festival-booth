'use client';

import { useEffect, useMemo, useState } from 'react';
import { DEPARTMENTS, DEPARTMENT_COLORS, TIME_SLOTS, getOwnDepartment, getContrastTextColor } from '@/lib/departments';

const CAPACITY = 25;

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

  const ownDept = useMemo(() => getOwnDepartment(studentClass), [studentClass]);

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
