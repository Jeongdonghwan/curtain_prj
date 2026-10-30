"""오늘 빌드할 OPEN_WAVE 를 날짜로 계산 (커튼명장: wave = 오픈일부터 며칠째 + 1, 최대 31).
post-launch 의 drip_status.py 와 출력 형식이 같아 _ops/daily.sh 가 그대로 쓴다. 이 사이트는 10일 나눠 열기 + 30일 새 페이지라 7일 규칙 대신 이 계산을 쓴다.

  python -I scripts/drip/drip_status.py data/drip.json [YYYY-MM-DD]   → WAVE=<n> POST=0 URL=<주소>
"""
import datetime as dt, json, sys


def wave(cfg, today):
    cap = dt.date.fromisoformat(cfg['hold']) if cfg.get('hold') else today  # hold: 그 날짜 묶음에서 오픈 멈춤
    return max(0, min(cfg['maxWave'], (min(today, cap) - dt.date.fromisoformat(cfg['launch'])).days + 1))


if __name__ == '__main__':
    if len(sys.argv) < 2:
        c, t = {'launch': '2026-10-30', 'maxWave': 31}, dt.date.fromisoformat
        assert [wave(c, t(d)) for d in ('2026-10-29', '2026-10-30', '2026-11-08', '2026-11-29', '2026-12-31')] == [0, 1, 10, 31, 31]
        assert wave({**c, 'hold': '2026-11-02'}, t('2026-11-20')) == 4
        sys.exit(print('demo ok'))
    cfg = json.load(open(sys.argv[1], encoding='utf-8'))
    today = dt.date.fromisoformat(sys.argv[2]) if len(sys.argv) > 2 else (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).date()  # KST
    print(f'WAVE={wave(cfg, today)} POST=0 URL={cfg["siteUrl"]}')
