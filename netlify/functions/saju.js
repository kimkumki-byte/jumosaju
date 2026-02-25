/**
 * Netlify Function: /api/saju
 * - Computes Four Pillars (Saju / BaZi) locally using open-source library.
 * - Returns a "주모" style reading without calling any LLM.
 *
 * NOTE: Requires dependency: lunar-javascript
 */
const { Solar, Lunar } = require('lunar-javascript');

// Korean labels
const STEM_HAN_TO_KR = {
  '甲':'갑','乙':'을','丙':'병','丁':'정','戊':'무','己':'기','庚':'경','辛':'신','壬':'임','癸':'계'
};
const BRANCH_HAN_TO_KR = {
  '子':'자','丑':'축','寅':'인','卯':'묘','辰':'진','巳':'사','午':'오','未':'미','申':'신','酉':'유','戌':'술','亥':'해'
};
const STEMS_KR = ['갑','을','병','정','무','기','경','신','임','계'];
const BRANCHES_KR = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const ELEMENT_BY_STEM_KR = { 갑:'목', 을:'목', 병:'화', 정:'화', 무:'토', 기:'토', 경:'금', 신:'금', 임:'수', 계:'수' };
const ELEMENT_BY_BRANCH_KR = { 자:'수', 축:'토', 인:'목', 묘:'목', 진:'토', 사:'화', 오:'화', 미:'토', 신:'금', 유:'금', 술:'토', 해:'수' };

// Yin/Yang mapping (음/양)
const STEM_YINYANG = { 갑:'양', 을:'음', 병:'양', 정:'음', 무:'양', 기:'음', 경:'양', 신:'음', 임:'양', 계:'음' };
const BRANCH_YINYANG = { 자:'양', 축:'음', 인:'양', 묘:'음', 진:'양', 사:'음', 오:'양', 미:'음', 신:'양', 유:'음', 술:'양', 해:'음' };

// 十神(ShiShen) mapping CN -> KR
const SHISHEN_CN_TO_KR = {
  '比肩': '비견',
  '劫财': '겁재',
  '食神': '식신',
  '伤官': '상관',
  '偏财': '편재',
  '正财': '정재',
  '七杀': '편관',
  '正官': '정관',
  '偏印': '편인',
  '正印': '정인',
  '日主': '일간'
};

// 五行 mapping CN -> KR (some outputs are like '土火')
const WUXING_CN_TO_KR = { '木':'목', '火':'화', '土':'토', '金':'금', '水':'수' };

// Branch relations
const BRANCH_CHONG = new Map([
  ['자','오'], ['오','자'],
  ['축','미'], ['미','축'],
  ['인','신'], ['신','인'],
  ['묘','유'], ['유','묘'],
  ['진','술'], ['술','진'],
  ['사','해'], ['해','사']
]);
const BRANCH_HAP = new Map([
  ['자','축'], ['축','자'],
  ['인','해'], ['해','인'],
  ['묘','술'], ['술','묘'],
  ['진','유'], ['유','진'],
  ['사','신'], ['신','사'],
  ['오','미'], ['미','오']
]);

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(obj)
  };
}

function badRequest(code, message) {
  return json(400, { ok: false, error: { code, message } });
}

function parseYmd(str) {
  if (typeof str !== 'string') return null;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3]);
  if (!Number.isInteger(y) || !Number.isInteger(mo) || !Number.isInteger(d)) return null;
  if (mo < 1 || mo > 12) return null;
  if (d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function parseHm(str) {
  if (str == null) return null;
  if (typeof str !== 'string') return null;
  const m = str.match(/^(\d{2}):(\d{2})$/);
  if (!m) return null;
  const hh = Number(m[1]); const mm = Number(m[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

function toPillarObj(gzHan) {
  // gzHan like "甲子"
  if (typeof gzHan !== 'string' || gzHan.length < 2) return null;
  const stemHan = gzHan[0];
  const branchHan = gzHan[1];
  const stem = STEM_HAN_TO_KR[stemHan] || stemHan;
  const branch = BRANCH_HAN_TO_KR[branchHan] || branchHan;
  return { stem, branch };
}

function wuxingHanToKr(str) {
  if (typeof str !== 'string' || !str.length) return null;
  // ex: '土火' -> '토화'
  return str.split('').map(ch => WUXING_CN_TO_KR[ch] || ch).join('');
}

function shishenCnToKr(v) {
  if (v == null) return null;
  if (Array.isArray(v)) return v.map(x => SHISHEN_CN_TO_KR[x] || x);
  if (typeof v === 'string') return SHISHEN_CN_TO_KR[v] || v;
  return v;
}

function computeBranchRelations(pillars) {
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);
  const branches = ps.map(p => p.branch);
  const hap = [];
  const chong = [];
  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i];
      const b = branches[j];
      if (BRANCH_HAP.get(a) === b) hap.push([a, b]);
      if (BRANCH_CHONG.get(a) === b) chong.push([a, b]);
    }
  }
  return { hap, chong };
}

function normalizeInput(body) {
  const name = (body.name ?? null);
  const calendar = body.calendar;
  const isLeapMonth = body.isLeapMonth ?? null;
  const birthDate = body.birthDate;
  const birthTime = body.birthTime ?? null;
  const sex = body.sex ?? null;
  const timezone = body.timezone || 'Asia/Seoul';

  if (calendar !== 'solar' && calendar !== 'lunar') {
    return { error: { code: 'INVALID_CALENDAR', message: 'calendar는 "solar" 또는 "lunar"여야 해요.' } };
  }
  const ymd = parseYmd(birthDate);
  if (!ymd) {
    return { error: { code: 'INVALID_BIRTHDATE', message: 'birthDate는 "YYYY-MM-DD" 형식으로 보내주세요.' } };
  }
  let hm = null;
  if (birthTime !== null) {
    hm = parseHm(birthTime);
    if (!hm) {
      return { error: { code: 'INVALID_BIRTHTIME', message: 'birthTime은 "HH:mm" 형식(예: "09:30") 또는 null 이어야 해요.' } };
    }
  }
  if (sex !== null && sex !== 'M' && sex !== 'F') {
    return { error: { code: 'INVALID_SEX', message: 'sex는 "M" 또는 "F" 또는 null 이어야 해요.' } };
  }
  if (calendar === 'lunar' && isLeapMonth !== null && typeof isLeapMonth !== 'boolean') {
    return { error: { code: 'INVALID_LEAP', message: 'isLeapMonth는 boolean 또는 null 이어야 해요.' } };
  }
  return { name: typeof name === 'string' ? name.trim().slice(0, 20) : null, calendar, isLeapMonth: calendar === 'lunar' ? !!isLeapMonth : null, ymd, hm, sex, timezone };
}

/**
 * Calculate pillars via lunar-javascript (6tail).
 * - If calendar is lunar: convert lunar->solar first (supports leap month by negative month).
 * - For missing time: compute year/month/day using a safe midday time and return hour as null.
 */
function calcPillars({ calendar, isLeapMonth, ymd, hm }) {
  let solarYmd = null;
  let lunarYmd = null;

  if (calendar === 'solar') {
    solarYmd = { ...ymd };
    // also compute lunar date for meta
    const solar = Solar.fromYmd(ymd.y, ymd.m, ymd.d);
    const lunar = solar.getLunar();
    lunarYmd = { y: lunar.getYear(), m: lunar.getMonth(), d: lunar.getDay(), isLeap: lunar.isLeap() };
  } else {
    // lunar input
    lunarYmd = { y: ymd.y, m: ymd.m, d: ymd.d, isLeap: !!isLeapMonth };
    // lunar-javascript: leap month can be represented with negative month in fromYmd/fromYmdHms
    const lunarMonth = isLeapMonth ? -Math.abs(ymd.m) : ymd.m;
    const lunar = Lunar.fromYmd(ymd.y, lunarMonth, ymd.d);
    const solar = lunar.getSolar();
    solarYmd = { y: solar.getYear(), m: solar.getMonth(), d: solar.getDay() };
  }

  // pick time for calculation
  const hh = hm ? hm.hh : 12;
  const mm = hm ? hm.mm : 0;

  const solar = Solar.fromYmdHms(solarYmd.y, solarYmd.m, solarYmd.d, hh, mm, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar(); // uses jieqi for month pillar internally

  const yearGz = eightChar.getYear();   // e.g. "甲子"
  const monthGz = eightChar.getMonth();
  const dayGz = eightChar.getDay();
  const timeGz = eightChar.getTime();

  const pillars = {
    year: toPillarObj(yearGz),
    month: toPillarObj(monthGz),
    day: toPillarObj(dayGz),
    hour: hm ? toPillarObj(timeGz) : null
  };

  const details = {
    wuxing: {
      year: wuxingHanToKr(eightChar.getYearWuXing()),
      month: wuxingHanToKr(eightChar.getMonthWuXing()),
      day: wuxingHanToKr(eightChar.getDayWuXing()),
      hour: hm ? wuxingHanToKr(eightChar.getTimeWuXing()) : null
    },
    nayin: {
      year: eightChar.getYearNaYin(),
      month: eightChar.getMonthNaYin(),
      day: eightChar.getDayNaYin(),
      hour: hm ? eightChar.getTimeNaYin() : null
    },
    shishen: {
      year: { gan: shishenCnToKr(eightChar.getYearShiShenGan()), zhi: shishenCnToKr(eightChar.getYearShiShenZhi()) },
      month: { gan: shishenCnToKr(eightChar.getMonthShiShenGan()), zhi: shishenCnToKr(eightChar.getMonthShiShenZhi()) },
      day: { gan: shishenCnToKr(eightChar.getDayShiShenGan()), zhi: shishenCnToKr(eightChar.getDayShiShenZhi()) },
      hour: hm ? { gan: shishenCnToKr(eightChar.getTimeShiShenGan()), zhi: shishenCnToKr(eightChar.getTimeShiShenZhi()) } : null
    },
    xunkong: {
      year: eightChar.getYearXunKong(),
      month: eightChar.getMonthXunKong(),
      day: eightChar.getDayXunKong(),
      hour: hm ? eightChar.getTimeXunKong() : null
    },
    hideGan: {
      year: eightChar.getYearHideGan(),
      month: eightChar.getMonthHideGan(),
      day: eightChar.getDayHideGan(),
      hour: hm ? eightChar.getTimeHideGan() : null
    }
  };

  return {
    pillars,
    details,
    meta: {
      calendarUsed: calendar,
      solarDate: `${String(solarYmd.y).padStart(4,'0')}-${String(solarYmd.m).padStart(2,'0')}-${String(solarYmd.d).padStart(2,'0')}`,
      lunarDate: lunarYmd ? `${String(lunarYmd.y).padStart(4,'0')}-${String(Math.abs(lunarYmd.m)).padStart(2,'0')}-${String(lunarYmd.d).padStart(2,'0')}` : null,
      isLeapMonth: calendar === 'lunar' ? !!isLeapMonth : (lunarYmd ? !!lunarYmd.isLeap : null)
    }
  };
}

function countElements(pillars) {
  const counts = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  const add = (el, w=1)=>{ if (counts[el]!=null) counts[el]+=w; };

  const all = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);
  for (const p of all) {
    add(ELEMENT_BY_STEM_KR[p.stem], 1.0);
    add(ELEMENT_BY_BRANCH_KR[p.branch], 0.8);
  }
  return counts;
}

function countElementsWithHidden(pillars, details) {
  const counts = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  const add = (el, w=1)=>{ if (counts[el]!=null) counts[el]+=w; };

  const all = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);
  for (const p of all) {
    add(ELEMENT_BY_STEM_KR[p.stem], 1.0);
    add(ELEMENT_BY_BRANCH_KR[p.branch], 0.9);
  }

  if (details && details.hideGan) {
    const addHidden = (arr) => {
      if (!Array.isArray(arr)) return;
      for (const han of arr) {
        const kr = STEM_HAN_TO_KR[han] || null;
        if (!kr) continue;
        add(ELEMENT_BY_STEM_KR[kr], 0.45);
      }
    };
    addHidden(details.hideGan.year);
    addHidden(details.hideGan.month);
    addHidden(details.hideGan.day);
    addHidden(details.hideGan.hour);
  }

  return counts;
}

function countYinYang(pillars) {
  const counts = { 음:0, 양:0 };
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);
  for (const p of ps) {
    counts[STEM_YINYANG[p.stem] || '양'] += 1;
    counts[BRANCH_YINYANG[p.branch] || '양'] += 1;
  }
  return counts;
}

function topTwoElements(counts) {
  const arr = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  return { top: arr[0], second: arr[1], bottom: arr[arr.length-1] };
}

function makeJumoReading({ name, sex, pillars, meta, details }) {
  const honor = sex === 'M' ? '도령' : sex === 'F' ? '아가씨' : '손님';
  const who = (name && name.length) ? `${name} ${honor}` : honor;

  const y = `${pillars.year.stem}${pillars.year.branch}`;
  const m = `${pillars.month.stem}${pillars.month.branch}`;
  const d = `${pillars.day.stem}${pillars.day.branch}`;
  const h = pillars.hour ? `${pillars.hour.stem}${pillars.hour.branch}` : '시주 미상';

  const dm = pillars.day.stem; // 일간
  const dmEl = ELEMENT_BY_STEM_KR[dm] || '—';

  const counts = countElementsWithHidden(pillars, details);
  const { top, second, bottom } = topTwoElements(counts);

  const yy = countYinYang(pillars);
  const rel = computeBranchRelations(pillars);

  const timeNote = pillars.hour
    ? `태어난 시각도 적어줬으니, 시주까지 곁들여 더 또렷하게 봐드렸수다.`
    : `근데 손님, 태어난 시각은 “모름”이라 했지요? 시주가 빠지면 끝맛이 살짝 달라질 수 있수다. 큰 줄기는 보되, 디테일은 범위로 봐드릴게요.`;

  const calendarNote = meta.calendarUsed === 'lunar'
    ? `음력으로 적어줬다 했으니, 주모가 양력으로 바꿔서(윤달까지) 절기 기준으로 맞춰봤수다.`
    : `양력으로 적어줬다 했으니, 절기 기준으로 월주까지 착착 맞춰 봤수다.`;

  const elLine = `오행으로 정리해보면, ${top[0]} 기운이 제일 앞장서고(힘이 센 편), 다음이 ${second[0]}이수다. 반대로 ${bottom[0]}은 상대적으로 약해서 “보충하면 운이 부드러워지는 포인트”로 보면 돼요.`;

  const dmLine = `일간(나의 중심)이 “${dm}(${dmEl})”이니, 기본 성향은 ${dmEl}의 결로 갑니더. 한 번 기준 잡으면 쉽게 안 꺾이고, 결과물로 보여주려는 기질이 있수다.`;

  const shishenMonth = details?.shishen?.month?.gan || null;
  const shishenYear = details?.shishen?.year?.gan || null;
  const shishenHint = (shishenMonth || shishenYear)
    ? `십신으로 보면 월간 쪽에 “${shishenMonth || '—'}”, 연간 쪽에 “${shishenYear || '—'}” 기운이 보이는데, 이건 겉으로 드러나는 사회적 톤(일/사람/평판)에 영향을 줘요.`
    : `십신 정보는 여기선 간단히만 곁들일게요. (기준은 일간 대비 관계요.)`;

  const relLine = (() => {
    const parts = [];
    if (rel.hap.length) parts.push(`지지에 합(붙는 힘)이 ${rel.hap.map(p=>p.join('·')).join(', ')} 이렇게 보이고`);
    if (rel.chong.length) parts.push(`충(부딪히는 힘)은 ${rel.chong.map(p=>p.join('·')).join(', ')} 이렇게 걸렸수다`);
    if (!parts.length) return `지지 합·충은 크게 튀는 게 없어서, 큰 파도보단 잔잔히 흐르는 편이수다.`;
    return `지지 흐름을 보면 ${parts.join(' / ')}. 합은 “도와주는 손”, 충은 “변화 버튼”이라 보면 편해요.`;
  })();

  const yinYangLine = `음양으로는 양 ${yy.양} : 음 ${yy.음} 비율이구먼. 양이 많으면 추진/결단이 빠르고, 음이 많으면 관찰/정리가 강해져요. (둘 다 장점이니 균형만 잡으면 됨!)`;

  const gentleWarning = (() => {
    if (top[0] === '금') return `금 기운이 강하면 “정확함”이 장점인데, 말이 직구로 꽂힐 때가 있수다. 중요한 대화는 ‘사실 → 배려’ 순서로 말하면 갈등이 확 줄어들어요.`;
    if (top[0] === '화') return `화가 앞서면 추진력은 끝내주는데, 마음이 급해질 때 실수도 같이 따라오지요. ‘속도 조절’만 되면 성과가 확 튑니더.`;
    if (top[0] === '수') return `수가 많으면 생각이 깊고 감이 좋아요. 대신 걱정도 같이 커질 수 있수다. 머리로만 굴리지 말고 “작게라도 행동”이 운을 깨워요.`;
    if (top[0] === '목') return `목이 강하면 성장/확장운이 좋아요. 대신 일을 벌리는 속도가 빨라져서 과부하가 올 수 있수다. 우선순위 1~2개만 꽉 잡아보슈.`;
    return `토가 도드라지면 중심은 단단한데, 버티다 보면 고집으로 비칠 때도 있수다. ‘상대 방식’을 한 번 더 인정해주면 귀인이 붙어요.`;
  })();

  const career = (() => {
    if (dmEl === '금') return `금 일간은 “기준/품질/결정”에 강해요. 기획·관리·품질·심사·컨설팅처럼 ‘정리해서 딱 맞추는 일’에 힘이 납니더. 단, 처음엔 차갑게 보일 수 있으니 말맛을 부드럽게 하면 평판이 더 잘 붙어요.`;
    if (dmEl === '목') return `목 일간은 ‘키우는 힘’이 있어요. 브랜딩/영업/교육/콘텐츠처럼 성장과 확장을 만드는 일에 맞고, 사람과 네트워크를 타면 운이 더 살아납니다.`;
    if (dmEl === '화') return `화 일간은 ‘보여주는 힘’이 있어요. 무대/세일즈/마케팅/리더 역할에서 존재감이 커지고, 속도가 붙으면 큰 판도 가능해요. 다만 번아웃 관리는 필수!`;
    if (dmEl === '수') return `수 일간은 정보/감각/흐름을 읽는 데 강해요. 기획·분석·연구·상담·콘텐츠 등 “읽고 해석하는 일”에 재능이 있고, 깊이가 쌓일수록 돈이 따라오지요.`;
    return `토 일간은 ‘받쳐주는 힘’이 있어요. 운영/재무/조직관리처럼 기반을 다지는 일에 강하고, 꾸준히 쌓아 올리면 큰 신뢰를 먹고 사는 팔자요.`;
  })();

  const love = `인연운은 한마디로 “급하게 잡으려 하면 도망가고, 내 리듬으로 살면 자연히 붙는 타입”에 가깝수다. ${top[0]} 기운이 강한 쪽은 사랑에서도 그 기운이 튀어요. 그래서 ${top[0]==='화'?'표현이 확 뜨겁게':top[0]==='수'?'마음이 깊게':top[0]==='금'?'기준이 또렷하게':top[0]==='목'?'관계가 확 커지게':'책임감이 묵직하게'} 움직일 수 있수다. ‘내 방식’만 고집하지 말고, 상대의 속도도 한 번 맞춰보슈.`;

  const money = `재물운은 “한 방”보단 “쌓여서 커지는 운” 쪽이 더 안전하수다. 특히 ${bottom[0]} 기운이 약한 편이라 했지요? 이건 돈 자체가 없다는 뜻이 아니라, 돈이 굴러가는 방식이 ‘내 기본 성향’과 다를 수 있다는 뜻이수다. 그래서 자동저축/정기적 정산/지출 기준표처럼 ‘규칙’을 만들어두면 새는 돈이 확 줄고, 재물운이 매끈해져요.`;

  const health = `건강은 사주로 “경향”만 보는 거요. ${top[0]}이 강하면 그 기운이 몰리는 쪽이 있으니, ${top[0]==='화'?'열·수면·심신 과열':top[0]==='수'?'부종·순환·컨디션 기복':top[0]==='금'?'피부·호흡·긴장':top[0]==='목'?'근육·눈 피로·스트레칭': '소화·체중·붓기'} 관리가 포인트가 될 수 있수다. 생활에서 할 수 있는 작은 루틴 하나만 잡아도 운이 부드럽게 풀려요.`;

  const timeBlock = pillars.hour
    ? `시주까지 있으니 디테일(말년운/자식운/하루 리듬)이 더 또렷해졌수다. 나중에 대운/세운까지 붙이면 더 길게 풀 수 있구먼.`
    : `시각이 없으면 시주가 빠져서 “말년운/자식운/일상 리듬” 쪽은 범위로 봐야 해요. 나중에 태어난 시간 알게 되면 그때 한 번 더 좁혀드릴게요.`;

  const closing = `마지막으로 한 잔만 더 따르자면… 사주는 ‘정답지’가 아니라 ‘지도’요. ${who}는 자기 발로 움직일 때 운이 살아나는 상이니, 오늘부터 딱 한 가지—작게라도 꾸준히 해보슈. 주모가 뒤에서 응원하겠수다 🍶`;

  return [
    `어이구~ ${who}, 어서오슈. 주막 바람이 차니 막걸리 한 잔 데워드릴까유?`,
    calendarNote,
    `📜 팔자 뽑아보니 이렇게 나왔수다\n- 연주: ${y}\n- 월주: ${m}\n- 일주: ${d}\n- 시주: ${h}`,
    '',
    `🌟 1) 전체 톤(한 줄 요약)\n${dmLine}\n${elLine}\n${yinYangLine}`,
    '',
    `💪 2) 기질·성격(일간/십신 포인트)\n${shishenHint}\n${relLine}\n${gentleWarning}`,
    '',
    `🎯 3) 일/커리어 흐름\n${career}\n“잘 되는 방식”은 보통 ${top[0]} 쪽을 살리고, 부족한 ${bottom[0]}은 시스템으로 보완하는 거요. 혼자 끙끙보다 ‘정리/루틴/협업’ 붙이면 속도가 납니더.`,
    '',
    `💕 4) 인연·연애운\n${love}\n연애든 인간관계든, ${who}는 ‘말의 온도’만 한 단계 부드럽게 올리면 운이 확 좋아지는 타입이수다.`,
    '',
    `💰 5) 재물·직업운\n${money}\n돈은 운도 운인데, 습관이 반이요. 특히 지출 결정을 “기분” 말고 “규칙”으로 하면 재물복이 붙어요.`,
    '',
    `🌿 6) 건강·생활 루틴\n${health}\n몸은 운의 그릇이라, 컨디션만 잡혀도 일/사람/돈 흐름이 같이 살아나요.`,
    '',
    `🍶 7) 주모의 한마디\n${timeBlock}\n${timeNote}\n${closing}`
  ].join('\n');
}

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: { code: 'METHOD_NOT_ALLOWED', message: 'POST만 허용돼요.' } });
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch (e) {
    return badRequest('INVALID_JSON', '요청 본문(JSON)이 올바르지 않아요.');
  }

  const norm = normalizeInput(body);
  if (norm.error) return badRequest(norm.error.code, norm.error.message);

  try {
    const { pillars, meta, details } = calcPillars(norm);
    if (!pillars.year || !pillars.month || !pillars.day) {
      return json(500, { ok:false, error:{ code:'CALC_FAILED', message:'사주 계산에 실패했어요. 입력값을 다시 확인해보슈.' }});
    }

    const readingText = makeJumoReading({
      name: norm.name,
      sex: norm.sex,
      pillars,
      meta,
      details
    });

    return json(200, {
      ok: true,
      version: 'calc_v1',
      data: {
        pillars,
        details,
        meta: {
          calendarUsed: meta.calendarUsed,
          solarDate: meta.solarDate,
          lunarDate: meta.lunarDate,
          isLeapMonth: meta.isLeapMonth,
          timezone: norm.timezone
        },
        readingText
      }
    });
  } catch (e) {
    return json(500, {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: e && e.message ? e.message : '서버 오류가 났수다.'
      }
    });
  }
};
