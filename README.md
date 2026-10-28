# 커튼·블라인드 전국 지역 SEO

전국 지역명 × 커튼·블라인드 키워드로 지역 롱테일 페이지를 만들기 위한 프로젝트. 사이트 구조는 web_Agency·crain_prj 와 같은 방식(데이터 + 조합기, Next.js 정적 export)으로 갈 예정.

## 파일

- `data/regions-kr.json` — 검색용으로 정규화한 전국 지역명 3,230개 (시도 17·시군 160·구 192·동 1,458·읍면 1,403)
- `keywords/커튼블라인드_전국키워드.xlsx` — 키워드 30,915개 (요약 / 키워드 / 지역목록 시트)
- `scripts/build_regions.py` — 행정동 원본 → regions-kr.json
- `scripts/gen_keywords.py` — regions-kr.json → 엑셀

## 다시 만들기

```bash
# 원본: https://github.com/vuski/admdongkor  verYYYYMMDD/HangJeongDong_verYYYYMMDD.geojson (현재 ver20261001)
python -I scripts/build_regions.py <다운받은 geojson 경로>
python -I scripts/gen_keywords.py
```

## 지역명 규칙

- 번호 행정동은 검색어 형태로 합침: 역삼1동·역삼2동 → 역삼동, 원효로1동 → 원효로
- 전국에 같은 이름이 있거나 읍·면이면 상위 지역 접두: 부산 중앙동, 가평 청평면
- 같은 이름의 시는 시도 접두: 강원 고성 / 경남 고성, 경기 광주

## 단어

- 모든 지역: 커튼, 블라인드, 커튼블라인드, 암막커튼, 롤스크린, 콤비블라인드, 커튼집, 커튼설치, 블라인드설치
- 시도·시군·구 추가: 우드블라인드, 버티컬블라인드, 전동커튼, 맞춤커튼, 블라인드업체
- 단어는 `scripts/gen_keywords.py` 상단 BASE·LOCAL·WIDE 목록에서 바꾼다.
