import './globals.css';

export const metadata = {
  title: '외국어 축제 부스 체험 신청',
  description: '축제 부스 체험 신청 사이트',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
