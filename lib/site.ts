// 사이트 설정 — 연락처·고정 링크·브랜드 사실. 출처: curtainmaster.co.kr (2026-10-26 확인)
// SEO 페이지마다 공식몰·스마트스토어 링크가 고정으로 들어간다(헤더·히어로 아래 띠·푸터·구조화 데이터 sameAs).

export const SITE_URL = process.env.SITE_URL || 'https://curtainblind.co.kr';
export const BRAND = '커튼명장';
export const BRAND_EN = 'CURTAIN MASTER';

export const LINKS = {
  home: 'https://curtainmaster.co.kr/',
  store: 'https://smartstore.naver.com/curtainmaster',
};

export const CONTACT = {
  phone: '1877-8540', // 대표 전화
  sms: '010-5345-6001', // 문자 상담
};

export const BUSINESS = {
  name: '커튼명장',
  bizNumber: '237-86-01565',
  mailOrder: '2025-인천남동구-2382호',
  address: '인천 남동구 호구포로 194 더마크원 제3층 제333호 (고잔동, 마크원 지식산업센터)',
  email: 'karam21c@nate.com',
};

// 공식몰 표기 사실 (숫자는 공식몰 표기 그대로)
export const FACTS = {
  leadDays: '평균 3일 이내 출고', // 국내 맞춤제작 기준
  freeItems: '자석끈 + 커튼레일 무료',
};

// 순차 오픈: wave = 오픈일부터 며칠째 + 1 (data/site-pages.json). 1·4·7·10 = 기존 5,982 를 25%씩, 2~31 = 새 페이지 하루 약 70개
// 오늘 값은 python -I scripts/drip/drip_status.py data/drip.json. 전체 빌드는 OPEN_WAVE=31
export const OPEN_WAVE = Number(process.env.OPEN_WAVE || 1);
// 표기만 다른 페이지(강남/강남구)는 대표 페이지로 canonical + 사이트맵 제외
export const MERGE_VARIANTS = true;

export const tel = `tel:${CONTACT.phone.replace(/[^0-9]/g, '')}`;
export const smsHref = `sms:${CONTACT.sms.replace(/[^0-9]/g, '')}`;
