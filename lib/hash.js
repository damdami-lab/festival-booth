export async function sha256Hex(text) {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(digest);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// 학생 신청 취소용 비밀번호 해시. 학년+반+번호를 섞어서(pepper 역할) 같은 비밀번호를
// 여러 학생이 써도 해시값은 서로 다르게 만든다. 원문 비밀번호는 절대 저장하지 않는다.
export async function hashApplicationPassword(password, studentGrade, studentClass, studentNumber) {
  return sha256Hex(`${studentGrade}_${studentClass}_${studentNumber}_${String(password)}`);
}

export async function adminSessionToken() {
  const password = process.env.ADMIN_PASSWORD || '';
  const secret = process.env.ADMIN_SESSION_SECRET || '';
  return sha256Hex(`${password}::${secret}`);
}
