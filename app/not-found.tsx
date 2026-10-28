import Link from 'next/link';
import { Actions, OfficialLinks } from '../components/Common';

export default function NotFound() {
  return (
    <main>
      <div className="wrap content page-top">
        <h1 className="page-title">페이지를 찾을 수 없습니다</h1>
        <p className="prose-p">아직 열리지 않았거나 주소가 바뀐 페이지입니다. <Link href="/area/">지역 목록</Link>에서 찾아보세요.</p>
        <Actions />
        <OfficialLinks />
      </div>
    </main>
  );
}
