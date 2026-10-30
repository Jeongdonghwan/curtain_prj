// 커튼·블라인드 키워드 페이지 조합기.
// 사실 근거: data/products.json(공식몰 상품·가격), data/regions-sg.json(지역 주거·창), lib/site.ts FACTS(공식몰 표기),
//           data/dong-apts.json(동별 공동주택 단지 — K-apt 단지 기본정보).
// 하지 않는 것: 없는 할인·없는 보증 기간·출처 없는 숫자, 블라인드 가격(공식몰에 상품이 없어 상담으로 안내).
import { Page, Product, PRODUCTS, ALL_PAGES, factsOf, aptsOf, hash } from './data';
import { BRAND, CONTACT, FACTS, BUSINESS } from './site';
import { j } from './ko';

type Topic = 'curtain' | 'blackout' | 'blind' | 'motor';
const topicOf = (w: string): Topic =>
  /암막/.test(w) ? 'blackout' : /전동/.test(w) ? 'motor' : /블라인드|롤스크린/.test(w) && !/커튼블라인드/.test(w) ? 'blind' : 'curtain';

const pick = <T,>(arr: T[], s: string, salt: string) => arr[hash(`${s}::${salt}`) % arr.length];
const rotate = <T,>(arr: T[], s: string, salt: string) => { if (!arr.length) return arr; const k = hash(`${s}::${salt}`) % arr.length; return [...arr.slice(k), ...arr.slice(0, k)]; };
const won = (n: number) => `${n.toLocaleString()}원`;

// 빛 투과 눈금 위치 (0 = 다 비침, 100 = 완전 차단)
export const LIGHT: { key: string; label: string; pos: number }[] = [
  { key: '비침', label: '비침 쉬폰', pos: 8 },
  { key: '중간 비침', label: '중간 비침 쉬폰', pos: 30 },
  { key: '비침 없는', label: '비침 없는 쉬폰', pos: 52 },
  { key: '거실', label: '거실커튼(겉지)', pos: 72 },
  { key: '암막', label: '암막커튼', pos: 88 },
  { key: '100% 암막', label: '100% 암막', pos: 100 },
];

const BA: Record<string, { cap: string }> = {
  a: { cap: '거실커튼 겉지+속지 세트' }, b: { cap: '거실커튼 겉지+속지 세트' }, c: { cap: '침실커튼 암막+속지 세트' },
  d: { cap: '비침 없는 도톰 쉬폰' }, e: { cap: '중간 비침 실키 쉬폰' }, f: { cap: '차르르 비침 쉬폰' },
};
export const BA_KEYS = Object.keys(BA);
export const baCaption = (k: string) => BA[k].cap;

const HOME_CASES = [8, 9, 10, 11, 12, 13, 14, 15, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58];
const BIZ_CASES = [16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44];
const BLIND_CASES = [12, 14, 16, 17, 19, 27, 33, 34, 35, 36, 38, 41, 48];

export function compose(p: Page) {
  const s = p.slug;
  const t = topicOf(p.word);
  const f = factsOf(p);
  const place = p.region;
  const dongLevel = p.level === '동' || p.level === '읍면';
  const area = dongLevel ? `${f.name} ${place.split(' ').slice(-1)[0]}` : place === f.kw ? f.name : place;
  const spot = pick(f.spots, s, 'spot');

  // ---- 동 단지 (K-apt 등록 단지: 이름·사용승인·세대·복도·층) — 같은 구 안 동 페이지를 가르는 고유 사실 ----
  const dong = place.split(' ').slice(-1)[0];
  const info = dongLevel ? aptsOf(p) : undefined;
  const apt = info?.complexes ? info : undefined;
  // 단지 수는 법정동 기준이라 행정동(면목본동)과 다르면 법정동 이름으로 말한다
  const aptPlace = !apt ? dong : apt.legal.length === 1 ? (apt.legal[0] === dong ? dong : `법정동 ${apt.legal[0]}`) : dong;
  const legalNote = apt && apt.legal.length > 1 ? `(법정동 ${apt.legal.join('·')} 기준)` : '';
  const cx = apt?.complexes || [];
  const c0 = cx[0];
  const named = cx.slice(0, 3).map((x) => x.name).join('·');
  const dated = cx.filter((x) => x.year);
  const newC = [...dated].sort((a, b) => b.year! - a.year!)[0];
  const oldC = [...dated].sort((a, b) => a.year! - b.year!)[0];
  const halls = apt ? Object.entries(apt.hall).sort((a, b) => b[1] - a[1]) : [];
  const aptLines: string[] = !apt ? [] : [
    pick([
      `${aptPlace}${legalNote}에는 K-apt(공동주택관리정보시스템)에 등록된 공동주택 단지가 ${apt.count}곳, 합계 ${apt.households.toLocaleString()}세대입니다.`,
      `K-apt 기준 ${aptPlace}${legalNote} 공동주택은 ${apt.count}개 단지 ${apt.households.toLocaleString()}세대이고, 대표 단지는 ${named}입니다.`,
    ], s, 'a1'),
    apt.oldest && apt.newest && apt.oldest !== apt.newest
      ? pick([`사용승인 연도는 ${apt.oldest}년부터 ${apt.newest}년까지이고, 2010년 이후 단지가 ${apt.since2010}곳입니다.`,
        `가장 오래된 단지는 ${apt.oldest}년, 가장 최근 단지는 ${apt.newest}년에 사용승인을 받았습니다.`], s, 'a2')
      : apt.oldest ? `${aptPlace} 단지는 ${apt.oldest}년에 사용승인을 받았습니다.` : '',
    halls.length ? `복도 유형은 ${halls.map(([k, v]) => `${k} ${v}곳`).join(', ')}입니다.${apt.hall['복도식'] ? ` ${aptPlace}의 복도식 단지는 복도 쪽 작은 방 창이 따로 있어 그 창은 블라인드나 짧은 커튼으로 맞추는 경우가 많습니다.` : ''}` : '',
    c0 ? `세대수가 가장 많은 단지는 ${c0.name}(${c0.hh.toLocaleString()}세대)${apt.maxFloor ? `이고, 가장 높은 단지는 ${apt.maxFloor}층입니다` : '입니다'}.` : '',
    newC && newC.year! >= 2010 ? `${newC.name}(${newC.year}년)처럼 최근 단지는 ${t === 'blind' ? '창틀 깊이와 커튼박스 안쪽 폭' : '커튼박스 깊이와 천장 매립 레일 여부'}부터 확인합니다.` : '',
    oldC && oldC.year! < 2000 ? `${oldC.name}(${oldC.year}년)처럼 오래된 단지는 커튼박스가 얕거나 없을 수 있어 ${t === 'blind' ? '블라인드 브래킷 달 자리' : '레일 달 자리'}부터 봅니다.` : '',
  ].filter(Boolean);
  // 읍면은 K-apt 읍면 칸이 정확해서 '등록 단지 없음'을 말할 수 있다. 동은 행정동·법정동 이름이 달라 못 맞춘 것일 수 있어 말하지 않는다.
  // ---- 주민등록 세대 (행정안전부 2026.9, 행정동 기준) — 모든 동 페이지에 있다 ----
  const hh = info?.hh;
  const hhLines: string[] = !hh ? [] : [
    pick([
      `행정안전부 주민등록 기준(2026년 9월) ${j(dong, '은')} ${hh.total.toLocaleString()}세대이고, 그중 1인 세대가 ${hh.one}%입니다.`,
      `${dong} 주민등록 세대는 ${hh.total.toLocaleString()}세대(2026년 9월)로, 3·4인 세대 ${hh.family}%, 1인 세대 ${hh.one}%입니다.`,
      `2026년 9월 주민등록 기준 ${dong}에는 ${hh.total.toLocaleString()}세대가 살고, 2인 세대가 ${hh.two}%, 3·4인 세대가 ${hh.family}%입니다.`,
    ], s, 'h1'),
    hh.one >= hh.guOne + 4
      ? `${hh.guName} 평균(1인 세대 ${hh.guOne}%)보다 1인 세대가 많아, 창이 하나뿐인 원룸·오피스텔이면 ${t === 'blind' ? '롤스크린 하나' : t === 'blackout' ? '암막 한 겹' : '암막이나 쉬폰 한 겹'}으로도 충분합니다.`
      : hh.one <= hh.guOne - 4
        ? `${hh.guName} 평균(1인 세대 ${hh.guOne}%)보다 가족 세대 비중이 높아, 거실·침실·아이방 창을 한 번에 재서 함께 맞추면 ${t === 'blind' ? '방마다 블라인드 종류를 나누기' : '겉지·속지 색을 맞추기'} 편합니다.`
        : `1인 세대 비율은 ${hh.guName} 평균(${hh.guOne}%)과 비슷하고, ${hh.family >= 35 ? '3·4인 세대가 많아 아이방 암막 문의가 함께 들어오는 편입니다' : '방 수가 적은 집이 많아 창 한두 개만 맞추는 주문도 흔합니다'}.`,
  ];
  const noAptLine = dongLevel && !apt && p.level === '읍면'
    ? `${dong}에는 K-apt(공동주택관리정보시스템)에 등록된 공동주택 단지가 없습니다. 아파트 평형 기준 사이즈보다 창마다 가로·세로를 따로 재서 맞춥니다.` : '';

  // 상품
  const byKind = (k: string) => PRODUCTS.filter((x) => x.kind === k);
  const products: Product[] =
    t === 'blackout' ? rotate(byKind('암막'), s, 'pb')
      : t === 'blind' ? []
        : [...rotate(byKind('거실'), s, 'pg').slice(0, 2), ...rotate(byKind('쉬폰'), s, 'ps').slice(0, 2), ...rotate(byKind('암막'), s, 'pa').slice(0, 1)];
  const lightOn = t === 'blackout' ? ['암막', '100% 암막'] : t === 'blind' ? [] : Array.from(new Set(products.map((x) => x.light)));

  // 전후 사진
  const baKey = t === 'blackout' ? 'c' : pick(t === 'blind' ? ['a', 'b', 'd'] : ['a', 'b', 'd', 'e', 'f'], s, 'ba');

  // ---- 메타 ----
  const label = p.word;
  const title = pick([
    `${p.kw} | 맞춤제작 ${BRAND} 공식`,
    `${p.kw} — ${f.room} ${t === 'blind' ? '블라인드' : '커튼'} 실측·설치 | ${BRAND}`,
    `${p.kw} | ${spot} 등 ${f.name} ${t === 'blind' ? '블라인드' : '커튼'} 상담 ${BRAND}`,
  ], s, 'title');
  const priceLine = t === 'blind' ? '블라인드는 창 크기·소재 상담 후 견적' : t === 'blackout' ? '암막커튼 레일포함 풀세트 140,000원부터' : '쉬폰 80,000원 · 거실·암막 140,000원부터(레일포함 풀세트)';
  const description = `${area} ${label}. ${c0 ? `${named} 등 ${dong} ${apt!.count}개 단지` : f.windows.split(/[,.]/)[0]}. ${priceLine}. 국내 맞춤제작 ${FACTS.leadDays}, 대표전화 ${CONTACT.phone}.`;

  // ---- 히어로 ----
  const lead = c0 ? pick([
    `${dong} ${c0.name}${cx[1] ? `·${cx[1].name}` : ''} 같은 단지에 ${j(label, '을')} 맞춥니다. 가로 실측 사이즈만 고르면 높이는 상담 뒤 맞춤 제작해 ${FACTS.leadDays}합니다.`,
    `${dong} 공동주택 ${apt!.count}개 단지, ${apt!.households.toLocaleString()}세대. ${area} ${label} 상담은 창 사진과 가로 길이만 있으면 됩니다.`,
    `${c0.name}${c0.year ? `(${c0.year}년)` : ''} 같은 ${dong} 단지 ${f.room} 창에 ${j(label, '을')} 많이 맞춥니다. 국내 맞춤제작, ${FACTS.freeItems}.`,
  ], s, 'lead') : pick([
    `${f.name} ${f.homes.split(/[,와과]/)[0].trim()} 같은 집에 ${j(label, '을')} 맞춥니다. 가로 실측 사이즈만 고르면 높이는 상담 뒤 맞춤 제작해 ${FACTS.leadDays}합니다.`,
    `${f.windows}. ${area} ${label} 상담은 창 사진과 가로 길이만 있으면 됩니다.`,
    `${spot} 쪽 ${f.room} 창에 ${j(label, '을')} 많이 맞춥니다. 국내 맞춤제작, ${FACTS.freeItems}.`,
  ], s, 'lead');

  // ---- 도입 (주제 × 지역) ----
  const P1: Record<Topic, string[]> = {
    curtain: [
      `${BRAND} 커튼은 형상기억 가공으로 주름이 일정하게 떨어지고, 쉬폰은 나비주름으로 제작합니다. 가로 실측 사이즈를 골라 주문하시면 높이는 해피콜 상담 뒤 공간에 맞춰 만듭니다.`,
      `커튼은 겉지(거실·암막)와 속지(쉬폰)를 함께 다는 이중 커튼이 가장 많이 나갑니다. 낮에는 쉬폰으로 빛을 부드럽게 받고, 밤에는 겉지로 사생활과 빛을 막습니다.`,
      `맞춤 커튼에서 가장 중요한 숫자는 가로 길이입니다. 창 폭보다 양쪽을 넉넉히 잡아야 커튼을 젖혔을 때 창이 다 열리고, 닫았을 때 옆으로 빛이 새지 않습니다.`,
      `${area} ${f.room} 창은 ${f.windows.split(/[,.]/)[0]}. 그래서 커튼 길이와 레일 위치를 먼저 정하고 원단을 고릅니다.`,
      `쉬폰은 비침 정도가 세 단계입니다. 낮에 밖에서 안이 보이는 게 싫으면 비침 없는 쉬폰, 밝은 거실이면 차르르 비침 쉬폰을 고릅니다.`,
    ],
    blackout: [
      `암막커튼은 원단 뒷면에 빛을 막는 층이 있는 겉지입니다. ${BRAND} 암막은 형상기억 맞춤제작이고, 다이아 100% 암막처럼 빛을 거의 다 막는 원단부터 생활 암막까지 있습니다.`,
      `침실 암막은 원단만큼 길이와 폭이 중요합니다. 바닥에 닿게, 창보다 양옆을 넉넉히 만들어야 커튼 가장자리로 새는 빛이 줄어듭니다.`,
      `${area}에서 암막을 찾는 분은 대개 ${f.room} 창 때문입니다. ${f.windows.split(/[,.]/)[0]}.`,
      `암막은 색이 밝아도 빛 차단은 같습니다. 방 분위기에 맞춰 색을 고르고, 낮잠·숙면이 목적이면 다이아 100% 암막을 먼저 봅니다.`,
    ],
    blind: [
      `블라인드는 커튼보다 자리를 덜 차지하고 각도로 빛을 조절합니다. ${f.room} 창처럼 가구가 창 가까이 붙는 곳에 특히 맞습니다.`,
      `${j(BRAND, '는')} 주거와 상업 공간에 콤비·우드·롤스크린·알루미늄 블라인드를 시공했습니다. 병원·학교 체육관처럼 방염이 필요한 곳은 방염 콤비와 방염 롤스크린을 씁니다.`,
      `${j(label, '은')} 창틀 안쪽에 넣을지 바깥에 덮을지부터 정합니다. 안쪽은 깔끔하지만 창 깊이가 얕으면 손잡이와 부딪히고, 바깥은 빛 차단이 확실합니다.`,
      `${area}처럼 ${j(f.homes.split(/[,와과]/)[0].trim(), '이')} 많은 곳은 방마다 창 크기가 달라, 블라인드는 창마다 가로·세로를 따로 잽니다.`,
      `콤비블라인드는 원단 두 겹이 엇갈리며 투과와 차단을 바꾸고, 롤스크린은 말아 올리며, 우드블라인드는 날개 각도로 조절합니다. ${f.room}에는 셋 중 ${j(pick(['콤비', '롤스크린', '우드'], s, 'bpick'), '를')} 먼저 권합니다.`,
      `블라인드 견적은 소재, 창 개수, 전동 여부로 정해집니다. ${area} 창 사진을 보내주시면 창마다 맞는 종류를 나눠 드립니다.`,
    ],
    motor: [
      `전동커튼은 레일에 모터를 달아 리모컨이나 스위치로 여닫습니다. 천장이 높은 거실, 통창이 넓은 신축, 손이 닿기 어려운 창에 많이 답니다.`,
      `${BRAND} 견적에는 전동 커튼 레일 옵션이 있습니다. 원단은 일반 커튼과 같이 고르고, 레일만 전동으로 바꾸는 방식입니다.`,
      `${area}의 ${f.homes.split(/[,와과]/)[0].trim()}처럼 통창이 넓은 집은 커튼 무게가 무거워 전동 레일을 많이 고릅니다.`,
    ],
  };
  const P2 = [
    `${j(f.name, '은')} ${f.homes}. ${f.windows}.`,
    `${area}에서 상담이 많은 공간은 ${f.room}입니다. ${f.windows}.`,
    `${spot}·${f.spots.filter((x) => x !== spot).join('·')} 쪽에서 상담이 꾸준합니다. ${f.windows}.`,
  ];
  const [i1, i2] = rotate(P1[t], s, 'p1');
  const intro = [i1, aptLines.length ? `${aptLines[0]} ${pick([`${dong}에서도 ${f.room} 창 상담이 가장 많습니다.`, `${named.split('·')[0]} 같은 단지 창은 평형별로 가로 길이가 비슷해 사이즈 고르기가 쉽습니다.`], s, 'p2a')}` : noAptLine || hhLines[0] || pick(P2, s, 'p2'), i2];

  // ---- 같은 상위 지역의 다른 동네 (페이지마다 다른 고유 문장) ----
  // 동 페이지의 parent 는 구·시 짧은 이름(용산). 구·시 페이지는 자기 이름으로 찾아야 남의 구 동네가 안 섞인다
  const nearParent = dongLevel ? p.parent : place.replace(/^(서울|경기) /, '').replace(/(구|시|군)$/, '');
  const nearby = rotate(Array.from(new Set(ALL_PAGES.filter((x) => x.parent === nearParent && (x.level === '동' || x.level === '읍면') && x.region !== place)
    .map((x) => x.region.split(' ').slice(-1)[0]))), s, 'near').slice(0, 4);
  const nearApt = (d: string) => { const q = ALL_PAGES.find((x) => x.parent === nearParent && x.region.split(' ').slice(-1)[0] === d); const c = q && aptsOf(q)?.complexes?.[0]; return c ? `${d}(${c.name})` : d; };
  const nearLine = nearby.length >= 3
    ? (dongLevel ? `같은 ${f.name} 안 ${nearby.slice(0, 3).map(nearApt).join('·')}에서도 같은 기준으로 맞춥니다.` : `${f.name} 안에서는 ${nearby.join('·')} 같은 동네 상담이 꾸준합니다.`)
    : '';

  // ---- 공간별 고르는 법 (지역에서 많이 맞추는 공간을 맨 앞에) ----
  const ROOMS: Record<string, Record<Topic, string[]>> = {
    거실: {
      curtain: ['겉지(거실커튼)와 속지(쉬폰)를 함께 다는 이중 커튼이 기본입니다. 낮에는 쉬폰만 닫아 빛을 부드럽게 받습니다.', '통창이면 가로를 창 폭보다 넉넉히 잡아야 젖혔을 때 창이 다 드러납니다.'],
      blackout: ['거실은 완전 암막보다 거실커튼 겉지가 많습니다. TV 쪽 반사가 심하면 암막을 고릅니다.', '서향 거실은 오후 햇빛이 강해 암막 겉지와 쉬폰 속지로 많이 맞춥니다.'],
      blind: ['거실은 블라인드보다 커튼이 많지만, 통창 일부를 콤비블라인드로 맞추는 집도 있습니다.', '거실 소파 뒤 작은 창은 롤스크린으로 깔끔하게 정리합니다.'],
      motor: ['천장이 높거나 통창 폭이 넓은 거실에 전동 레일을 가장 많이 씁니다.', '겉지는 전동, 속지는 수동으로 나눠 다는 방법도 있습니다.'],
    },
    침실: {
      curtain: ['침실은 암막 겉지와 쉬폰 속지를 함께 달아 아침 햇빛을 막습니다.', '침대 머리 쪽 창은 커튼 길이를 바닥까지 내려 틈으로 새는 빛을 줄입니다.'],
      blackout: ['침실은 빛을 거의 다 막는 다이아 100% 암막 같은 원단을 많이 고릅니다.', '동향 침실은 해 뜨는 시간이 빨라 암막 길이를 바닥에 닿게 맞춥니다.'],
      blind: ['침실 블라인드는 암막 롤스크린이 많고, 커튼과 겹쳐 다는 집도 있습니다.', '콤비블라인드는 낮엔 투과, 밤엔 차단으로 각도만 바꿔 씁니다.'],
      motor: ['침실 전동커튼은 예약 개폐로 아침에 자동으로 열리게 쓰는 집이 있습니다.', '침대에서 손이 닿지 않는 창에 전동 레일을 답니다.'],
    },
    아이방: {
      curtain: ['아이방은 낮잠용 암막과 밝은 색 쉬폰을 함께 맞추는 경우가 많습니다.', '자석끈으로 커튼을 묶어 두면 아이가 잡아당기는 일이 줄어듭니다.'],
      blackout: ['아이방 낮잠에는 암막이 필수에 가깝습니다. 밝은 색 암막도 빛 차단은 같습니다.', '학원가 아파트는 공부방 창에 암막과 쉬폰을 함께 다는 집이 많습니다.'],
      blind: ['아이방은 줄이 없는 롤스크린이나 콤비블라인드가 안전합니다.', '책상 앞 창은 빛 각도를 조절하는 콤비블라인드가 편합니다.'],
      motor: ['아이 손이 닿지 않게 전동 레일로 바꾸는 집도 있습니다.', '줄 없는 전동 방식은 아이방 안전 면에서 많이 고릅니다.'],
    },
    '주방·드레스룸': {
      curtain: ['주방 창은 커튼보다 짧은 쉬폰이나 블라인드를 많이 씁니다.', '드레스룸은 옷 변색을 막으려 암막을 다는 집이 있습니다.'],
      blackout: ['드레스룸 창에는 옷 색이 바래지 않게 암막을 맞춥니다.', '주방 쪽은 기름때 때문에 암막보다 블라인드를 권하는 편입니다.'],
      blind: ['주방은 물·기름에 강한 알루미늄 블라인드나 롤스크린을 많이 씁니다.', '드레스룸은 우드블라인드로 수납장과 톤을 맞추기도 합니다.'],
      motor: ['주방·드레스룸 창은 작아 전동보다 수동이 많습니다.', '높은 주방 상부 창은 전동 롤스크린으로 맞추는 경우가 있습니다.'],
    },
    '사무실·상가': {
      curtain: ['사무실·병원은 방염 커튼이 필요한 경우가 많습니다.', '상가 쇼윈도는 시선을 가리면서 빛을 받는 쉬폰이 쓰입니다.'],
      blackout: ['병원 처치실·체육관은 방염 암막 전동커튼을 시공한 사례가 있습니다.', '회의실 프로젝터용으로 암막을 맞춥니다.'],
      blind: ['사무실은 콤비·알루미늄 블라인드, 병원·학교는 방염 롤스크린을 많이 씁니다.', '체육관·강당 같은 큰 창은 전동 롤스크린으로 맞춥니다.'],
      motor: ['큰 창이 많은 상업 공간은 상부 전동 방식으로 한 번에 여닫습니다.', '병원·학교 체육관에 방염 전동커튼 시공 사례가 있습니다.'],
    },
  };
  const roomKey = (r: string) => (ROOMS[r] ? r : '거실');
  const roomOrder = [roomKey(f.room), ...rotate(Object.keys(ROOMS).filter((r) => r !== roomKey(f.room)), s, 'rooms')].slice(0, dongLevel ? 3 : 4);
  const rooms = roomOrder.map((r, i) => ({ room: r, text: pick(ROOMS[r][t], s, `room${i}`) + (i === 0 ? ` ${area}에서 가장 많이 맞추는 공간입니다.` : '') }));

  // ---- 블라인드 종류 (블라인드 주제) / 원단 단계 (커튼 주제) ----
  const BLINDS = [
    { name: '콤비블라인드', d: '두 겹 원단이 엇갈리며 투과와 차단을 바꿉니다. 방염 콤비도 있습니다.' },
    { name: '우드블라인드', d: '나무 날개 각도로 빛을 조절합니다. 전동 우드블라인드 시공 사례가 있습니다.' },
    { name: '롤스크린', d: '말아 올리는 방식. 일반·암막·방염·전동 롤스크린으로 나뉩니다.' },
    { name: '알루미늄블라인드', d: '물과 기름에 강해 주방·사무실에 많이 씁니다.' },
    { name: '트리플쉐이드', d: '세 겹 원단으로 부드럽게 빛을 거릅니다.' },
    { name: '썬스크린', d: '바깥 풍경은 보이면서 햇빛과 열을 줄이는 원단입니다.' },
  ];
  const FABRICS = [
    { name: '차르르 비침 쉬폰', d: '빛이 가장 많이 들어오는 속지. 낮에 밝은 거실용.' },
    { name: '중간 비침 쉬폰', d: '실키·샤이니·린넨. 밖에서 안이 흐릿하게 보입니다.' },
    { name: '비침 없는 쉬폰', d: '도톰·밀크·포레스트. 낮에도 시선을 가립니다.' },
    { name: '거실커튼(겉지)', d: '에디션·발리·린넨·린네. 형상기억 겉지.' },
    { name: '암막커튼', d: '시그니처·별똥별·유안·일요일. 침실·아이방.' },
    { name: '100% 암막', d: '다이아 암막. 빛을 거의 다 막습니다.' },
  ];
  const nTypes = dongLevel ? 2 : 4; // 동 페이지는 구 페이지와 같은 종류 설명을 덜 반복
  const types = t === 'blind' ? rotate(BLINDS, s, 'bl').slice(0, nTypes) : rotate(FABRICS, s, 'fb').slice(0, nTypes);

  // ---- 지역 섹션 ----
  const region = {
    nearLine,
    heading: apt ? pick([`${dong} 아파트 단지`, `${dong} 단지별로 봅니다`, `${dong} 공동주택과 창`], s, 'rh') : pick([`${f.name} 창에 맞추는 법`, `${area} 집들은 이렇습니다`, `${f.room} 창부터 봅니다`], s, 'rh'),
    body: aptLines.length ? [...aptLines.slice(1), hhLines[1]].filter(Boolean).join(' ') || aptLines[0] : noAptLine ? `${hhLines.join(' ')} ${f.windows}.` : (hhLines[1] ? hhLines[1] + ' ' : '') + pick([
      `${f.windows}. 그래서 ${area} 상담에서는 ${t === 'blind' ? '창틀 안쪽 설치인지 바깥 설치인지' : '커튼박스 깊이와 레일 위치'}부터 확인합니다.`,
      `${j(f.name, '은')} ${f.homes}. ${t === 'blackout' ? '침실은 바닥까지 닿는 길이로 암막을, 거실은 쉬폰과 함께 이중으로' : t === 'blind' ? '거실은 커튼, 방과 주방은 블라인드로 나눠' : '거실은 겉지와 속지 이중으로, 방은 암막이나 쉬폰 한 겹으로'} 맞추는 집이 많습니다.`,
    ], s, 'rb'),
    complexes: cx.slice(0, 6),
    dl: apt ? ([
      ['등록 단지', `${apt.count}곳 · ${apt.households.toLocaleString()}세대`],
      ['사용승인', apt.oldest ? (apt.oldest === apt.newest ? `${apt.oldest}년` : `${apt.oldest}~${apt.newest}년`) : '-'],
      ['법정동', apt.legal.join(', ')],
      ...(hh ? [['주민등록 세대', `${hh.total.toLocaleString()}세대 · 1인 ${hh.one}% · 3·4인 ${hh.family}%`]] : []),
      [`${f.name} 창 특징`, f.windows],
    ] as [string, string][]) : hh ? ([
      ['주민등록 세대', `${hh.total.toLocaleString()}세대 (2026년 9월)`],
      ['1인 · 2인 · 3·4인', `${hh.one}% · ${hh.two}% · ${hh.family}% (${hh.guName} 평균 1인 ${hh.guOne}%)`],
      [`${f.name} 창 특징`, f.windows],
      ['많이 맞추는 공간', f.room],
    ] as [string, string][]) : [
      ['주거 형태', f.homes],
      ['창 특징', f.windows],
      ['많이 맞추는 공간', f.room],
      ['대표 동네', f.spots.join(', ')],
    ] as [string, string][],
  };

  // ---- 주문·설치 과정 (공식몰 안내 기준) ----
  const steps = dongLevel ? [
    { t: '가로 사이즈 선택', d: `${c0 ? `${c0.name} 같은 단지는 평형별 창 크기가 비슷하지만, ` : ''}${area} 집 창 가로 길이를 직접 재서 공식몰이나 스마트스토어에서 사이즈를 고릅니다.` },
    { t: '해피콜 상담', d: `높이는 해피콜 상담에서 ${dong} 집 천장·바닥 높이를 듣고 맞춤 제작합니다.` },
    { t: '국내 맞춤제작', d: `국내 맞춤제작 기준 ${FACTS.leadDays}, ${FACTS.freeItems}로 ${area}까지 보냅니다.` },
    { t: t === 'blind' ? '방문 실측·시공' : '설치', d: `${j(area, '이')} 방문 가능 지역이면 담당자가 무료 실측과 견적 상담을 하고, 설치 일정은 상담 뒤 안내합니다.` },
  ] : [
    { t: '가로 사이즈 선택', d: pick([`${area} 창의 가로 길이를 재서 공식몰이나 스마트스토어에서 사이즈를 고릅니다.`, `${f.room} 창 가로 길이를 재 주세요. 그 길이로 사이즈를 고르면 됩니다.`], s, 'st1') },
    { t: '해피콜 상담', d: pick(['높이는 해피콜 상담 뒤 공간에 맞춰 맞춤 제작합니다.', `높이는 전화로 확인합니다. ${f.windows.split(/[,.]/)[0].includes('커튼박스') ? '커튼박스 깊이도 이때 함께 봅니다.' : '천장에서 바닥까지 길이를 함께 봅니다.'}`], s, 'st2') },
    { t: '국내 맞춤제작', d: pick([`국내 맞춤제작 기준 ${FACTS.leadDays}됩니다. ${FACTS.freeItems}.`, `${FACTS.leadDays}. 레일포함 풀세트로 나가고 ${FACTS.freeItems}입니다.`], s, 'st3') },
    { t: t === 'blind' ? '방문 실측·시공' : '설치', d: pick([`${j(area, '이')} 방문 가능 지역이면 담당자가 무료 실측과 견적 상담을 하고, 설치 일정은 상담 뒤 안내합니다.`, `설치는 전문 시공기사가 합니다. ${area} 일정은 ${CONTACT.phone}로 확인해 주세요.`], s, 'st4') },
  ];

  // ---- FAQ ----
  const bank: Record<Topic, { q: string; a: string }[]> = {
    curtain: [
      { q: '높이는 어떻게 정하나요?', a: '가로 실측 사이즈를 골라 주문하시면 높이는 해피콜 상담 뒤 공간에 맞춰 맞춤 제작합니다.' },
      { q: '레일도 같이 오나요?', a: `레일포함 풀세트로 나가고, ${FACTS.freeItems} 제공됩니다.` },
      { q: '쉬폰 비침 정도는 어떻게 고르나요?', a: '차르르 비침 쉬폰, 중간 비침(실키·샤이니·린넨), 비침 없는(도톰·밀크·포레스트) 세 단계입니다. 낮에 밖에서 안이 보이는 게 싫으면 비침 없는 쪽을 고릅니다.' },
    ],
    blackout: [
      { q: '암막커튼 가격은요?', a: '공식몰 기준 암막커튼 레일포함 풀세트는 140,000원부터입니다(가로 사이즈별 상이).' },
      { q: '빛이 옆으로 새요.', a: '창보다 양옆을 넉넉히, 길이는 바닥에 닿게 맞추면 가장자리로 새는 빛이 줄어듭니다.' },
      { q: '쉬폰이랑 같이 달 수 있나요?', a: '겉지(암막)와 속지(쉬폰)를 함께 다는 이중 커튼으로 많이 주문합니다.' },
    ],
    blind: [
      { q: '블라인드 가격은요?', a: '블라인드는 창 크기와 소재(콤비·우드·롤스크린·알루미늄), 전동 여부에 따라 달라 상담 뒤 견적을 드립니다.' },
      { q: '방염 제품도 있나요?', a: '방염 콤비블라인드, 방염 롤스크린을 병원·학교·상업 공간에 시공했습니다.' },
      { q: '커튼이랑 섞어도 되나요?', a: '거실은 커튼, 방과 주방은 블라인드로 나눠 맞추는 집이 많습니다.' },
      { q: '창틀 안쪽에 달 수 있나요?', a: '창 깊이가 충분하면 안쪽 설치가 깔끔합니다. 손잡이와 부딪히면 바깥에 덮는 방식으로 바꿉니다.' },
      { q: '줄 없는 블라인드도 있나요?', a: '롤스크린과 전동 방식은 줄 없이 쓸 수 있어 아이방에서 많이 고릅니다.' },
      { q: '주방에는 뭐가 좋나요?', a: '물과 기름에 강한 알루미늄 블라인드나 롤스크린을 많이 씁니다.' },
    ],
    motor: [
      { q: '전동 레일만 따로 되나요?', a: '견적에서 전동 커튼 레일 옵션을 고르면 원단은 그대로, 레일만 전동으로 바뀝니다.' },
      { q: '어떤 집에 많이 다나요?', a: '천장이 높은 거실, 통창이 넓은 신축, 손이 닿기 어려운 창에 많이 답니다.' },
      { q: '설치는 어떻게 하나요?', a: '전문가 방문 설치 옵션이 있고, 지역별 일정은 상담 뒤 안내합니다.' },
    ],
  };
  const regionFaq = [
    { q: `${area}도 방문 실측이 되나요?`, a: `${dongLevel ? `${area} 같은 ` : ''}방문 가능 지역은 지역별 담당자가 무료 실측과 견적 상담을 합니다. ${area} 일정은 ${CONTACT.phone}로 확인해 주세요.` },
    c0 ? { q: `${c0.name} 같은 ${dong} 단지는 무엇을 많이 다나요?`, a: `${c0.name}${c0.year ? `(${c0.year}년 사용승인${c0.hall ? `, ${c0.hall}` : ''})` : ''} 같은 단지는 ${f.room}에 ${j(t === 'blind' ? '콤비블라인드나 롤스크린' : t === 'blackout' ? '암막 겉지와 쉬폰 속지' : '겉지와 쉬폰 속지 이중 커튼', '을')} 많이 맞춥니다. 같은 평형이면 ${c0.name} 안에서는 창 가로 길이가 비슷해, 평형을 알려주시면 사이즈 고르기가 빨라집니다.` } :
    { q: `${dongLevel ? dong : f.name} ${f.room} 창은 무엇을 많이 다나요?`, a: `${hh ? `${j(dong, '은')} 1인 세대 ${hh.one}%, 3·4인 세대 ${hh.family}%인 동네입니다.` : `${f.windows}.`} ${f.room}에는 ${j(t === 'blind' ? '콤비블라인드나 롤스크린' : t === 'blackout' ? '암막 겉지와 쉬폰 속지' : '겉지와 쉬폰 속지 이중 커튼', '을')} 많이 맞춥니다.` },
    { q: '얼마나 걸리나요?', a: `${dongLevel ? `${area}도 ` : ''}국내 맞춤제작 기준 ${FACTS.leadDays}됩니다.` },
  ];
  const faq = rotate([...regionFaq, ...rotate(bank[t], s, 'fq').slice(0, dongLevel ? 2 : 3)], s, 'faq');

  // ---- 사례 사진 ----
  const pool = t === 'blind' || /업체/.test(p.word) ? BLIND_CASES : HOME_CASES;
  const cases = rotate(pool, s, 'case').slice(0, 5).map((n) => `/images/case-${String(n).padStart(2, '0')}.webp`);

  // ---- 커튼집·설치 키워드 — 같은 동 '커튼'·'블라인드' 페이지와 섹션이 겹치지 않게 의도별 내용으로 바꾼다 ----
  // 사실 근거는 위와 같다(공식몰 표기·FACTS·BUSINESS). 설치 순서·확인 항목은 일반적인 시공 기준 문장이라 숫자를 넣지 않는다.
  const kind = /설치/.test(p.word) ? 'install' : /커튼집/.test(p.word) ? 'shop' : '';
  const thing = t === 'blind' ? '블라인드' : '커튼';
  const rail = t === 'blind' ? '브래킷' : '레일';
  const aptHint = newC && newC.year! >= 2010 ? `${newC.name}(${newC.year}년)처럼 최근 단지는 커튼박스 깊이와 천장 매립 레일 여부부터 봅니다.`
    : oldC && oldC.year! < 2000 ? `${oldC.name}(${oldC.year}년)처럼 오래된 단지는 커튼박스가 얕거나 없을 수 있어 ${rail} 달 자리부터 봅니다.` : '';
  const checks = (pool: [string, string][], salt: string) => rotate(pool, s, salt).slice(0, 4).map(([room, text], i) => ({ room, text: i === 0 && aptHint ? `${text} ${aptHint}` : text }));
  const INSTALL_CHECKS: Record<'curtain' | 'blind', [string, string][]> = {
    curtain: [
      ['레일 위치', `${dong} 집에 커튼박스가 있으면 박스 안 천장에, 없으면 창틀 위 벽에 레일을 답니다. 레일 위치가 정해져야 커튼 세로 길이가 정해집니다.`],
      ['가로 재기', `${f.room} 창도 창틀 폭이 아니라 레일을 달 자리의 길이를 잽니다. 양옆을 넉넉히 잡아야 커튼을 젖혔을 때 창이 다 드러납니다.`],
      ['세로 재기', `${dong} 집 천장 높이대로 레일에서 바닥까지 잽니다. 바닥에 닿게 할지 살짝 띄울지 정해 두면 해피콜 상담에서 높이를 그대로 맞춥니다.`],
      ['천장 재질', `${area} 집 천장이 콘크리트면 드릴과 앵커가 필요하고, 석고보드면 나사가 버티는 자리를 찾아 답니다.`],
      ['쓰던 레일', `${dong} 집에 쓰던 레일이 남아 있으면 길이와 위치가 새 커튼과 맞는지 먼저 봅니다. 맞지 않으면 떼어내고 새 레일을 답니다.`],
      ['걸리는 것', `${f.room} 창 주변 에어컨 배관, 창문 손잡이, 붙박이장 문이 커튼이 지나가는 길에 걸리지 않는지 봅니다.`],
      ['이중 레일', `겉지와 쉬폰 속지를 함께 달면 레일이 두 줄입니다. ${dong} 집 커튼박스 깊이가 두 줄을 넣을 만큼인지 확인합니다.`],
      ['전동 레일', `${area}에서 전동으로 달 생각이면 레일 끝 쪽 전원 위치를 봅니다. 견적에서 전동 커튼 레일 옵션을 고르면 됩니다.`],
    ],
    blind: [
      ['안쪽·바깥', `${dong} 집 창틀 안쪽에 넣을지 바깥 벽에 덮을지 먼저 정합니다. 안쪽은 깔끔하고, 바깥은 빛 차단이 확실합니다.`],
      ['창 깊이', `${f.room} 창을 안쪽에 달려면 창 깊이가 헤드레일보다 깊어야 하고, 창문 손잡이와 부딪히지 않아야 합니다.`],
      ['가로·세로 재기', `${area} 집도 안쪽 설치는 창틀 안 폭을 위·가운데·아래에서 재서 가장 짧은 값으로, 바깥 설치는 창보다 넉넉히 잡습니다.`],
      ['벽 재질', `${dong} 집 벽이 콘크리트면 드릴과 앵커가 필요하고, 창틀 위가 석고보드면 브래킷 나사가 버티는 자리를 찾습니다.`],
      ['줄 방향', `${f.room} 창은 조작줄을 왼쪽에 둘지 오른쪽에 둘지 정합니다. 가구가 붙은 쪽 반대로 두면 쓰기 편합니다.`],
      ['아이방', `${dong}${hh && hh.family >= 35 ? '처럼 3·4인 세대가 많은 동네는' : ''} 아이방은 줄 없는 롤스크린이나 전동 방식으로 맞추면 줄이 걸릴 일이 없습니다.`],
      ['창마다 따로', `${area} 집도 방마다 창 크기가 달라 블라인드는 창마다 가로·세로를 따로 잽니다. 같은 평형이어도 확장 여부에 따라 창이 다릅니다.`],
      ['방염', `${dong} 사무실·병원·학원은 방염 제품이 필요한지 먼저 확인합니다. 방염 콤비와 방염 롤스크린을 시공했습니다.`],
    ],
  };
  const SHOP_CHECKS: [string, string][] = [
    ['공식 판매처', `${area}에서 같은 제품명을 파는 곳이 여러 곳일 수 있습니다. ${BRAND} 공식 판매처는 공식몰(curtainmaster.co.kr)과 네이버 스마트스토어입니다.`],
    ['실측 방식', `${dong} 집 창을 직접 재서 주문하는지, 담당자가 와서 재는지 확인합니다. ${j(BRAND, '는')} 방문 가능 지역이면 무료 실측과 견적 상담을 합니다.`],
    ['제작 기간', `${area} 커튼집마다 맞춤 제작 기간이 다릅니다. ${j(BRAND, '는')} 국내 맞춤제작 기준 ${FACTS.leadDays}입니다.`],
    ['가격 구성', `${area} 커튼집 견적에 레일이 들어가는지 봅니다. ${BRAND} 공식몰 가격은 레일포함 풀세트이고 ${FACTS.freeItems}입니다.`],
    ['비침 정도', `${f.room} 창 쉬폰을 사진만으로 고르기 어렵다면 쉬폰 세 단계(차르르 비침·중간 비침·비침 없는)를 기준으로 상담합니다.`],
    ['시공 사례', `${c0 ? `${c0.name} 같은 ` : `${dong} `}비슷한 집 시공 사례를 보여 달라고 하세요. ${BRAND} 공식몰에는 아파트부터 병원·학교까지 시공 사례가 올라와 있습니다.`],
    ['높이 맞춤', `${dong} 집 천장 높이에 맞춰 주는지, 기성 길이인지 봅니다. ${j(BRAND, '는')} 가로 사이즈를 고르면 높이는 해피콜 상담 뒤 맞춤 제작합니다.`],
    ['블라인드까지', `${f.room}은 커튼, 다른 방은 블라인드처럼 나눠 달 거라면 한 곳에서 같이 상담하는 편이 빠릅니다. 블라인드는 창 크기·소재를 듣고 견적을 드립니다.`],
  ];
  const tk = t === 'blind' ? 'blind' : 'curtain';
  const over = !kind ? {} : kind === 'install' ? {
    lead: pick([`${dong}${c0 ? ` ${c0.name} 같은 단지` : ''} ${f.room} 창 ${thing} 설치를 상담합니다. ${rail} 자리와 가로 길이만 정하면 높이는 맞춤 제작해 ${FACTS.leadDays}합니다.`, `${area} ${thing} 설치는 ${rail} 달 자리부터 봅니다. 창 사진을 보내주시면 안쪽·바깥, 천장·벽 중 어디에 달지 정해 드립니다.`], s, 'ilead'),
    title: pick([`${p.kw} | 실측부터 ${rail} 설치까지 ${BRAND}`, `${p.kw} — ${area} ${thing} 설치 순서 | ${BRAND}`, `${p.kw} | ${f.room} ${thing} 설치 상담 ${BRAND}`], s, 'ititle'),
    intro: [
      pick(t === 'blind' ? [
        `블라인드 설치는 창틀 안쪽에 넣는 방식과 바깥 벽에 덮는 방식으로 나뉩니다. ${area} ${label} 상담도 이 둘 중 무엇인지부터 정합니다.`,
        `${area} ${j(label, '은')} ${rail} 달 자리를 정하고 그 자리를 기준으로 가로·세로를 재는 데서 시작합니다. 잰 길이가 곧 제작 사이즈가 됩니다.`,
        `블라인드는 커튼보다 사이즈 오차에 민감합니다. 창틀 안쪽 설치는 몇 군데를 재서 가장 짧은 값으로 맞춰야 걸리지 않습니다.`,
      ] : [
        `커튼 설치는 레일을 다는 일과 커튼을 거는 일로 나뉩니다. ${j(BRAND, '는')} 레일포함 풀세트로 나가 레일과 커튼을 한 번에 받습니다.`,
        `${area} ${j(label, '은')} 레일을 커튼박스 안에 달지, 천장이나 벽에 달지부터 정합니다. 레일 자리가 정해지면 그 자리에서 가로·세로를 잽니다.`,
        `직접 달지 방문 설치를 받을지는 천장 재질과 레일 위치로 정합니다. 커튼박스 안쪽이면 직접 다는 경우도 있고, 콘크리트 천장이면 드릴 작업이 필요합니다.`,
      ], s, 'ii1'),
      intro[1],
      pick([
        `잰 가로 길이로 공식몰이나 스마트스토어에서 사이즈를 고르면, 높이는 해피콜 상담에서 확인하고 맞춤 제작해 ${FACTS.leadDays}합니다.`,
        `${j(area, '이')} 방문 가능 지역이면 담당자가 무료 실측과 견적 상담을 하고, 설치 일정은 상담 뒤 안내합니다.`,
        `설치 전에 창 사진과 ${rail} 달 자리 사진을 문자(${CONTACT.sms})로 보내주시면 어디에 어떻게 달지 먼저 봐 드립니다.`,
      ], s, 'ii3'),
    ],
    rooms: checks(INSTALL_CHECKS[tk], 'ichk'),
    roomsHeading: pick([`${area} ${thing} 설치 전 확인`, '설치 전에 볼 것', `${dong} ${thing} ${rail} 자리 정하기`], s, 'irmh'),
    steps: [
      { t: `${rail} 자리 정하기`, d: t === 'blind' ? `${dong} 집 창틀 깊이를 보고 안쪽에 넣을지 바깥에 덮을지 정합니다.` : `${dong} 집 커튼박스가 있는지, 깊이가 얼마인지 보고 레일 자리를 정합니다.` },
      { t: '가로·세로 실측', d: `${dong} 집에서 정한 자리를 기준으로 가로를 재서 사이즈를 고르고, 세로는 ${t === 'blind' ? '창 높이' : '레일에서 바닥까지'}를 잽니다.` },
      { t: '해피콜·맞춤제작', d: `${dong} 집 높이는 해피콜 상담에서 확인하고 국내 맞춤제작 기준 ${FACTS.leadDays}, ${FACTS.freeItems}.` },
      { t: '설치', d: pick([`${j(area, '이')} 방문 가능 지역이면 담당자가 무료 실측과 견적 상담을 하고 설치 일정을 안내합니다.`, `${area} 설치 일정은 ${CONTACT.phone}로 확인해 주세요. 직접 다는 경우 ${dong} 집 ${rail} 위치만 맞으면 됩니다.`], s, 'ist4') },
    ],
    faq: rotate([
      { q: `${area}에서 ${thing} 직접 설치할 수 있나요?`, a: `${t === 'blind' ? '브래킷과 나사가 함께 가서' : '레일포함 풀세트로 레일과 커튼이 함께 가서'} 직접 다는 경우도 있습니다. ${dong} 집 천장이 콘크리트라 드릴 작업이 어려우면 방문 설치를 상담해 주세요.` },
      { q: `${area}에 설치 기사가 오나요?`, a: `${dong} 같은 방문 가능 지역은 지역별 담당자가 무료 실측과 견적 상담을 하고, 설치 일정은 상담 뒤 안내합니다. ${area} 일정은 ${CONTACT.phone}로 확인해 주세요.` },
      t === 'blind' ? { q: `${f.room} 창 깊이가 얕은데 안쪽에 달 수 있나요?`, a: `${dong} 집 창이 손잡이와 부딪히면 안쪽 대신 바깥 벽에 덮는 방식으로 바꾸고, 빛 차단도 바깥 설치가 더 확실합니다.` }
        : { q: `${area} 설치 때 레일은 따로 사야 하나요?`, a: `레일포함 풀세트로 나가고 ${FACTS.freeItems}입니다.` },
      { q: `${dong} 주문하고 설치까지 얼마나 걸리나요?`, a: `국내 맞춤제작 기준 ${FACTS.leadDays}되고, ${dong} 방문 설치는 상담 뒤 일정을 잡습니다.` },
      { q: `${dong} 집에 쓰던 레일을 그대로 써도 되나요?`, a: `${dong} 집에 남은 레일이 길이와 위치가 새 커튼과 맞으면 쓸 수 있고, 맞지 않으면 새 레일로 바꾸는 편이 깔끔합니다.` },
    ], s, 'ifaq').slice(0, 4),
    closing: { heading: pick([`${area} ${label} 상담`, `${rail} 자리 사진부터 보내주세요`, `${dong} ${thing} 설치 문의`], s, 'ich'), text: pick([`창 사진과 ${rail} 달 자리 사진을 문자(${CONTACT.sms})로 보내주시면 설치 방법과 사이즈를 골라 드립니다.`, `설치 일정과 방문 가능 여부는 전화(${CONTACT.phone})로 바로 확인됩니다.`], s, 'ict') },
  } : {
    lead: pick([`${area}에서 커튼집을 찾는다면 실측·제작 기간·레일 포함 여부부터 비교해 보세요. ${j(BRAND, "은")} 국내 맞춤제작 ${FACTS.leadDays}, ${FACTS.freeItems}입니다.`, `${dong}${c0 ? ` ${c0.name} 같은 단지` : ''} 집 커튼, 매장에 가지 않고 창 사진과 가로 길이로 상담합니다. 공식몰·스마트스토어가 공식 판매처입니다.`], s, 'slead'),
    title: pick([`${p.kw} | 공식 판매처 ${BRAND} 맞춤 커튼`, `${p.kw} — 고르는 기준과 ${area} 상담 | ${BRAND}`, `${p.kw} | 실측·제작 기간·가격 비교 ${BRAND}`], s, 'stitle'),
    intro: [
      pick([
        `${area}에서 커튼집을 고를 때는 가게가 가까운지보다 실측을 누가 하는지, 맞춤 제작 기간이 얼마인지, 레일이 가격에 들어가는지를 먼저 봅니다.`,
        `${j(BRAND, '는')} 공식몰과 네이버 스마트스토어에서 파는 맞춤 커튼 브랜드입니다. 창 가로 길이를 재서 주문하고, 방문 가능 지역이면 무료 실측을 받습니다.`,
        `커튼집마다 가격 표기가 다릅니다. ${BRAND} 공식몰은 레일포함 풀세트 기준으로 쉬폰 80,000원, 거실·암막 140,000원부터 가로 사이즈별로 표기합니다.`,
      ], s, 'si1'),
      intro[1],
      pick([
        `공식몰 표기로 누적 상담 120,000건 이상, 누적 시공 30,000세트 이상, 하루 평균 150건을 출고합니다.`,
        `${area} 커튼집 상담은 창 사진 한두 장과 가로 길이면 시작됩니다. 문자 ${CONTACT.sms}로 받습니다.`,
        `사업자등록번호는 ${BUSINESS.bizNumber}(통신판매업 ${BUSINESS.mailOrder})이고, 공식 판매처는 공식몰과 스마트스토어 두 곳입니다.`,
      ], s, 'si3'),
    ],
    rooms: checks(SHOP_CHECKS, 'schk'),
    roomsHeading: pick([`${area} 커튼집 고를 때`, '커튼집 고르는 기준', `${dong} 커튼집 비교 전에`], s, 'srmh'),
    steps: [
      { t: '사진·가로 길이', d: `${dong} 집 창 사진과 가로 길이를 문자(${CONTACT.sms})로 보내거나 전화로 알려 주세요.` },
      { t: '제품·사이즈 고르기', d: `${f.room} 창에 맞는 원단과 가로 사이즈를 공식몰이나 스마트스토어에서 고르고, 가격은 레일포함 풀세트 기준입니다.` },
      { t: '해피콜', d: `높이는 해피콜 상담에서 ${dong} 집 천장·바닥 높이를 듣고 맞춥니다.` },
      { t: '제작·배송', d: `국내 맞춤제작 기준 ${FACTS.leadDays}, ${FACTS.freeItems}로 ${area}까지 보내고, 방문 가능 지역은 무료 실측·설치 상담도 합니다.` },
    ],
    faq: rotate([
      { q: `${area}에서 매장에 가서 봐야 하나요?`, a: `${dong} 집 창 사진과 가로 길이로 상담하고, 방문 가능 지역은 담당자가 무료 실측과 견적 상담을 합니다.` },
      { q: `${f.room} 커튼 가격은 어디서 보나요?`, a: `공식몰에 레일포함 풀세트 가격이 가로 사이즈별로 있고, ${f.room} 창에 많이 다는 쉬폰은 80,000원, 거실·암막은 140,000원부터입니다.` },
      { q: `${area}에서 주문은 공식몰과 스마트스토어 중 어디서 하나요?`, a: `두 곳 모두 ${BRAND} 공식 판매처라 ${dong}에서도 편한 곳에서 주문하시면 됩니다.` },
      { q: `${dong}까지 얼마나 걸리나요?`, a: `국내 맞춤제작 기준 ${FACTS.leadDays}되고, ${area}까지 택배로 보냅니다.` },
      { q: `${dong} 집 블라인드도 같이 되나요?`, a: `방마다 콤비·우드·롤스크린·알루미늄 블라인드를 함께 상담하고, 블라인드는 창 크기와 소재를 듣고 견적을 드립니다.` },
    ], s, 'sfaq').slice(0, 4),
    closing: { heading: pick([`${area} 커튼집 상담`, '창 사진부터 보내주세요', `${dong} 맞춤 커튼 상담`], s, 'sch'), text: pick([`창 사진과 가로 길이를 문자(${CONTACT.sms})로 보내주시면 원단과 사이즈를 골라 드립니다.`, `가격·제작 기간은 전화(${CONTACT.phone})로 바로 확인됩니다.`], s, 'sct') },
  };

  return {
    topic: t, facts: f, area, title, description, lead,
    eyebrow: `${p.sido === '서울특별시' ? '서울' : '경기'} · ${f.name}`,
    specs: [['지역', area], ['많이 맞추는 곳', f.room], ['상담', `${CONTACT.phone} · 문자 ${CONTACT.sms}`]] as [string, string][],
    intro, region, products, lightOn, baKey, heroKey: pick(['d', 'e', 'f'], s, 'hero'), steps, faq, cases, rooms, types, nearby,
    typesHeading: t === 'blind' ? pick([`${area}에서 많이 다는 블라인드`, '블라인드 종류', `${f.room}에 맞는 블라인드`], s, 'th') : pick(['원단 단계', `${area} 커튼 원단 고르기`, '쉬폰부터 암막까지'], s, 'th'),
    roomsHeading: pick([`${area} 공간별 고르는 법`, `${f.room}부터 고릅니다`, '방마다 다르게'], s, 'rmh'),
    priceNote: t === 'blind' ? pick(['블라인드는 공식몰에 정가 상품이 없어 창 크기·소재 상담 뒤 견적을 드립니다.', `${area} 블라인드 견적은 창 개수와 소재를 듣고 드립니다.`], s, 'pn') : '공식몰 표기 가격, 레일포함 풀세트 · 가로 사이즈 기준. 정확한 금액은 사이즈별로 다릅니다.',
    closing: { heading: pick([`${area} ${label} 상담`, `${f.room} 창 길이부터 알려주세요`, `${area}, 맞춤 커튼 3일`], s, 'ch'), text: pick([`창 사진과 가로 길이를 문자(${CONTACT.sms})로 보내주시면 제품과 사이즈를 골라 드립니다.`, `${area} ${f.room} 창 사진 한두 장과 가로 길이면 충분합니다. 문자 ${CONTACT.sms}.`, `${label} 고민은 전화(${CONTACT.phone})가 가장 빠릅니다. 창 사진은 문자로 받습니다.`], s, 'ct') },
    ...over,
  };
}
