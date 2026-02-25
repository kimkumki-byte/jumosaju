/**
 * Netlify Function: /.netlify/functions/saju  (proxied as /api/saju)
 * Local Four Pillars (만세력) + 주모 스타일 해설 생성
 *
 * - 외부 LLM/API 호출 없음
 * - 오픈소스 lunar-javascript(6tail) 기반 계산
 */
const { Solar, Lunar } = require('lunar-javascript');

// ---- Maps ----
const STEM_HAN_TO_KR = {'甲':'갑','乙':'을','丙':'병','丁':'정','戊':'무','己':'기','庚':'경','辛':'신','壬':'임','癸':'계'};
const BRANCH_HAN_TO_KR = {'子':'자','丑':'축','寅':'인','卯':'묘','辰':'진','巳':'사','午':'오','未':'미','申':'신','酉':'유','戌':'술','亥':'해'};
const WUXING_CN_TO_KR = {'木':'목','火':'화','土':'토','金':'금','水':'수'};

// 십성(중문) → 한글
const SHISHEN_CN_TO_KR = {
  '比肩':'비견','劫财':'겁재','食神':'식신','伤官':'상관',
  '偏财':'편재','正财':'정재','七杀':'편관','正官':'정관',
  '偏印':'편인','正印':'정인'
};

// ---- helpers ----
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
  // "YYYY-MM-DD"
  if (typeof str !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str.trim());
  if (!m) return null;
  const y = parseInt(m[1], 10), mo = parseInt(m[2], 10), d = parseInt(m[3], 10);
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function parseHm(str) {
  // "HH:MM"
  if (!str) return null;
  const m = /^(\d{2}):(\d{2})$/.exec(String(str).trim());
  if (!m) return null;
  const hh = parseInt(m[1], 10), mm = parseInt(m[2], 10);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return { hh, mm };
}

function toPillarObjFromHan(stemHan, branchHan, shishenGanCn, shishenZhiCn) {
  const stemKr = STEM_HAN_TO_KR[stemHan] || stemHan;
  const branchKr = BRANCH_HAN_TO_KR[branchHan] || branchHan;
  return {
    stemHan, branchHan,
    stemKr, branchKr,
    shishen: {
      gan: shishenCnToKr(shishenGanCn),
      zhi: shishenCnToKr(shishenZhiCn)
    }
  };
}

function wuxingHanToKr(str) {
  if (typeof str !== 'string' || !str.length) return null;
  // ex: '土火' -> '토화'
  return str.split('').map(ch => WUXING_CN_TO_KR[ch] || ch).join('');
}
function shishenCnToKr(str) {
  if (!str) return null;
  return SHISHEN_CN_TO_KR[str] || str;
}

function safeText(s) {
  return String(s ?? '').replace(/[<>]/g, c => (c === '<' ? '&lt;' : '&gt;'));
}

// 합/충(최소) - 지지 기준
const LIU_HE = new Set(['자축','인해','묘술','진유','사신','오미']);
const LIU_CHONG = new Set(['자오','축미','인신','묘유','진술','사해']);
function computeBranchRelations(pillars) {
  const arr = [
    ['year', pillars.year],
    ['month', pillars.month],
    ['day', pillars.day],
    ['hour', pillars.hour]
  ].filter(x => x[1] && x[1].branchHan);

  const hap = [];
  const chong = [];
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i][1].branchHan, b = arr[j][1].branchHan;
      const key = a + b;
      const key2 = b + a;
      if (LIU_HE.has(key) || LIU_HE.has(key2)) hap.push([arr[i][0], arr[j][0], a, b]);
      if (LIU_CHONG.has(key) || LIU_CHONG.has(key2)) chong.push([arr[i][0], arr[j][0], a, b]);
    }
  }
  return { hap, chong };
}

function countYinYang(pillars) {
  // 간단: 천간/지지 인덱스 짝/홀로 음양 추정(전통표: 갑병무경임=양, 을정기신계=음 / 자인진오신술=양, 축묘사미유해=음)
  const yangStems = new Set(['甲','丙','戊','庚','壬']);
  const yangBranches = new Set(['子','寅','辰','午','申','戌']);
  let yin = 0, yang = 0;
  const ps = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);
  for (const p of ps) {
    if (yangStems.has(p.stemHan)) yang++; else yin++;
    if (yangBranches.has(p.branchHan)) yang++; else yin++;
  }
  return { yin, yang, total: yin + yang };
}

function countElementsWithHidden(pillars, details) {
  // 가중치: 겉오행(천간1 + 지지1), 장간(각 0.6씩)
  const w = { 목:0, 화:0, 토:0, 금:0, 수:0 };
  const all = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean);

  for (const p of all) {
    const wx = details.wuxing?.[p._key];
    if (wx && wx.length >= 2) {
      const a = wx[0], b = wx[1];
      if (w[a] != null) w[a] += 1;
      if (w[b] != null) w[b] += 1;
    }
  }
  // hidden (지장간) → 오행으로 변환
  const hidden = details.hideGanHan || {};
  for (const k of Object.keys(hidden)) {
    const list = hidden[k] || [];
    for (const stemHan of list) {
      const elem = stemToElement(stemHan);
      if (elem && w[elem] != null) w[elem] += 0.6;
    }
  }
  return w;
}

function stemToElement(stemHan){
  // 갑을=목, 병정=화, 무기=토, 경신=금, 임계=수
  if (stemHan==='甲'||stemHan==='乙') return '목';
  if (stemHan==='丙'||stemHan==='丁') return '화';
  if (stemHan==='戊'||stemHan==='己') return '토';
  if (stemHan==='庚'||stemHan==='辛') return '금';
  if (stemHan==='壬'||stemHan==='癸') return '수';
  return null;
}

function topTwoElements(counts){
  const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  return { top: entries[0], second: entries[1], bottom: entries[entries.length-1] };
}

function longBody(lines){
  return lines.join('\n');
}

// ---- core calc ----
function calcPillars({ calendar, isLeapMonth, ymd, hm }) {
  let solarYmd = null;
  let lunarYmd = null;

  if (calendar === 'solar') {
    solarYmd = { ...ymd };
    const solar = Solar.fromYmd(ymd.y, ymd.m, ymd.d);
    const lunar = solar.getLunar();
    lunarYmd = { y: lunar.getYear(), m: lunar.getMonth(), d: lunar.getDay(), isLeap: lunar.isLeap() };
  } else {
    lunarYmd = { y: ymd.y, m: ymd.m, d: ymd.d, isLeap: !!isLeapMonth };
    const lunarMonth = isLeapMonth ? -Math.abs(ymd.m) : ymd.m;
    const lunar = Lunar.fromYmd(ymd.y, lunarMonth, ymd.d);
    const solar = lunar.getSolar();
    solarYmd = { y: solar.getYear(), m: solar.getMonth(), d: solar.getDay() };
  }

  const hh = hm ? hm.hh : 12;
  const mm = hm ? hm.mm : 0;

  const solar = Solar.fromYmdHms(solarYmd.y, solarYmd.m, solarYmd.d, hh, mm, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const yearGz = eightChar.getYear();   // "甲子"
  const monthGz = eightChar.getMonth();
  const dayGz = eightChar.getDay();
  const timeGz = eightChar.getTime();

  const yearStemHan = yearGz[0], yearBranchHan = yearGz[1];
  const monthStemHan = monthGz[0], monthBranchHan = monthGz[1];
  const dayStemHan = dayGz[0], dayBranchHan = dayGz[1];
  const timeStemHan = timeGz[0], timeBranchHan = timeGz[1];

  const pillars = {
    year: toPillarObjFromHan(yearStemHan, yearBranchHan, eightChar.getYearShiShenGan(), eightChar.getYearShiShenZhi()?.[0]),
    month: toPillarObjFromHan(monthStemHan, monthBranchHan, eightChar.getMonthShiShenGan(), eightChar.getMonthShiShenZhi()?.[0]),
    day: toPillarObjFromHan(dayStemHan, dayBranchHan, eightChar.getDayShiShenGan(), eightChar.getDayShiShenZhi()?.[0]),
    hour: hm ? toPillarObjFromHan(timeStemHan, timeBranchHan, eightChar.getTimeShiShenGan(), eightChar.getTimeShiShenZhi()?.[0]) : null
  };
  // for mapping in details
  pillars.year._key='year'; pillars.month._key='month'; pillars.day._key='day'; if (pillars.hour) pillars.hour._key='hour';

  // hideGan: 八字地支藏干
  const hide = {
    year: eightChar.getYearHideGan ? eightChar.getYearHideGan() : [],
    month: eightChar.getMonthHideGan ? eightChar.getMonthHideGan() : [],
    day: eightChar.getDayHideGan ? eightChar.getDayHideGan() : [],
    hour: eightChar.getTimeHideGan ? eightChar.getTimeHideGan() : []
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
      gan: {
        year: shishenCnToKr(eightChar.getYearShiShenGan()),
        month: shishenCnToKr(eightChar.getMonthShiShenGan()),
        day: shishenCnToKr(eightChar.getDayShiShenGan()),
        hour: hm ? shishenCnToKr(eightChar.getTimeShiShenGan()) : null
      },
      zhiPrimary: {
        year: shishenCnToKr(eightChar.getYearShiShenZhi()?.[0]),
        month: shishenCnToKr(eightChar.getMonthShiShenZhi()?.[0]),
        day: shishenCnToKr(eightChar.getDayShiShenZhi()?.[0]),
        hour: hm ? shishenCnToKr(eightChar.getTimeShiShenZhi()?.[0]) : null
      }
    },
    hideGanHan: {
      year: hide.year || [],
      month: hide.month || [],
      day: hide.day || [],
      hour: hm ? (hide.hour || []) : []
    },
    hideGanKr: {
      year: (hide.year||[]).map(h=>STEM_HAN_TO_KR[h]||h),
      month: (hide.month||[]).map(h=>STEM_HAN_TO_KR[h]||h),
      day: (hide.day||[]).map(h=>STEM_HAN_TO_KR[h]||h),
      hour: hm ? (hide.hour||[]).map(h=>STEM_HAN_TO_KR[h]||h) : []
    },
    dishi: {
      year: eightChar.getYearDiShi ? eightChar.getYearDiShi() : null,
      month: eightChar.getMonthDiShi ? eightChar.getMonthDiShi() : null,
      day: eightChar.getDayDiShi ? eightChar.getDayDiShi() : null,
      hour: hm && eightChar.getTimeDiShi ? eightChar.getTimeDiShi() : null
    },
    xunkong: {
      year: eightChar.getYearXunKong ? eightChar.getYearXunKong() : null,
      month: eightChar.getMonthXunKong ? eightChar.getMonthXunKong() : null,
      day: eightChar.getDayXunKong ? eightChar.getDayXunKong() : null,
      hour: hm && eightChar.getTimeXunKong ? eightChar.getTimeXunKong() : null
    }
  };

  const meta = {
    calendarUsed: calendar,
    solarDate: `${String(solarYmd.y).padStart(4,'0')}-${String(solarYmd.m).padStart(2,'0')}-${String(solarYmd.d).padStart(2,'0')}`,
    lunarDate: `${String(lunarYmd.y).padStart(4,'0')}-${String(Math.abs(lunarYmd.m)).padStart(2,'0')}-${String(lunarYmd.d).padStart(2,'0')}`,
    isLeapMonth: !!lunarYmd.isLeap,
    timeKnown: !!hm,
    timeText: hm ? `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}` : '시간 모름'
  };

  const relations = computeBranchRelations(pillars);

  return { pillars, details, meta, relations };
}

// ---- reading ----
function makeReadingSections({ name, sex, pillars, meta, details, relations }) {
  const who = name ? `${name} 손님` : (sex==='M' ? '도령' : (sex==='F' ? '아가씨' : '손님'));
  const dm = pillars.day.stemHan; // 일간(한자)
  const dmKr = STEM_HAN_TO_KR[dm] || dm;
  const counts = countElementsWithHidden(pillars, details);
  const yy = countYinYang(pillars);
  const top = topTwoElements(counts);
  const topElem = top.top[0], topVal = top.top[1];
  const lowElem = top.bottom[0], lowVal = top.bottom[1];
  const hapTxt = relations.hap.length ? relations.hap.map(x=>`${x[2]}${x[3]}`).join(', ') : '뚜렷한 합은 덜 보이고';
  const chongTxt = relations.chong.length ? relations.chong.map(x=>`${x[2]}${x[3]}`).join(', ') : '큰 충은 덜 보이니';

  const intro = [
    `어이~ ${who}, 주모가 잔 하나 따라놓고 팔자부터 펼쳐보겠수다.`,
    `오늘 기운의 큰 줄기는 **${topElem}** 쪽이 가장 세고(${topVal.toFixed(1)}점쯤), 반대로 **${lowElem}** 쪽은 숨이 좀 짧수다(${lowVal.toFixed(1)}점쯤).`,
    `일간은 **${pillars.day.stemHan}(${dmKr})** 요, 음양은 양 ${yy.yang} / 음 ${yy.yin} 비율로 흐름이 잡히네요.`,
    `${hapTxt}… ${chongTxt}… 큰 파도는 “방향만 잡으면” 힘이 되겠수다.`
  ];

  const frame = [
    `겉으론 조용해도 속은 바닥이 깊은 사람으로 보이수.`,
    `특히 ${topElem} 기운이 강하면 “몰입·집요함·버티기”가 장점이지만, 한쪽으로 쏠리면 마음이 답답해지기 쉽수다.`,
    `반대로 ${lowElem} 기운이 약하면 “결정·표현·정리”가 늦어질 수 있으니, 생활에서 그 역할을 일부러 만들어줘야 해요.`,
    `주모 말로 한마디면… **센 물줄기엔 둑이 필요**하다는 거지요.`
  ];

  const personality = [
    `${who}은(는) ${pillars.day.stemHan}${pillars.day.branchHan} 일주 기운이 핵심인데요,`,
    `겉태(표현)는 유연해 보여도 속태는 “내 기준”이 단단한 편이수다.`,
    `십성 흐름을 보면, ${details.shishen?.gan?.month ? `월간은 ${details.shishen.gan.month}` : '월 기운'} 쪽이 색이 있고,`,
    `그래서 남들 눈치만 보기보단 “내가 납득해야 움직이는 타입”으로 읽혀요.`,
    `단, 고집이 서면 말이 짧아지니… 이때는 한 번 숨 고르고, ‘내가 지키려는 기준이 뭔지’부터 꺼내 말해보슈.`
  ];

  const work = [
    `일/커리어는 “한 번 잡으면 깊게 파는 쪽”이 맞수다.`,
    `오행으로 보면 ${topElem} 기운이 강하니, 전문성·분석·기획·설계 같은 ‘축적형’ 일에 힘이 붙어요.`,
    `다만 ${lowElem} 기운이 약한 쪽이면, 결과물 내는 속도(마감, 발표, 영업)가 발목 잡을 수 있수다.`,
    `그래서 방법은 단순해요: **작게라도 ‘주간 마감’**을 걸고, 남 앞에 내놓는 루틴을 만들면 운이 붙어요.`,
    `주모는 “계획 7, 실행 3”이 아니라, “실행 1을 먼저” 권하겠수다.`
  ];

  const money = [
    `재물은 물처럼 흐르기도, 또 물처럼 새기도 하수다.`,
    `강한 기운은 벌어들이는 힘도 되지만, 동시에 “충동 지출/결정 지연” 둘 다 만들 수 있거든요.`,
    `그래서 돈은 감으로 잡지 말고 **규칙으로 잡아야** 해요.`,
    `① 고정저축/투자 비율을 먼저 박고 ② 남는 돈으로 쓰는 구조, 이게 ${who}에게 맞수다.`,
    `큰 돈보다 “지속”이 승부수요.`
  ];

  const love = [
    `인연은 첫 단추가 중요하수다. ${who}은(는) 마음이 움직이면 깊게 가는데,`,
    `상대가 그 속도를 못 따라오면 “거리두기”가 생길 수 있어요.`,
    `합(合)이 있으면 관계가 잘 붙고, 충(沖)이 강하면 말의 칼끝이 서는데…`,
    `여긴 ${relations.chong.length ? '충이 보이니' : '충이 덜하니'} “말투 한 번만 부드럽게” 하면 인연운이 확 좋아져요.`,
    `연애운은 운이 아니라 습관이더이다. 표현을 ‘짧고 자주’ 해보슈.`
  ];

  const family = [
    `가족/뿌리 쪽은 연주 기운이 힌트를 주는데요,`,
    `연주의 십성이 ${details.shishen?.gan?.year || '연 기운'}로 읽히니, ‘기대/책임’의 결이 있수다.`,
    `부담을 혼자 다 지는 버릇이 생기면, 속이 쉽게 지쳐요.`,
    `가끔은 “내가 못 하는 걸 인정하는 용기”가 오히려 복이 됩니다.`,
    `${who}, 주모는 손님이 오래 가는 걸 더 좋아하거든요.`
  ];

  const health = [
    `건강은 단정하면 안 되고 ‘경향’만 보겠수다.`,
    `${topElem} 기운이 강하면 그 기운과 관련된 생활 습관이 체감에 크게 와요.`,
    `예를 들어 수(물) 쪽이 강하면 수면·순환·스트레스가, 화(불) 쪽이 강하면 열감·과로가 핵심이 되기 쉽수다.`,
    `그래서 처방은 딱 두 가지요: ① 수면 고정 ② 땀 나는 운동(가볍게라도).`,
    `몸이 풀리면 운도 풀려요. 이건 주모가 진짜 여러 손님 봐서 아는 거요.`
  ];

  const move = [
    `이동/환경운은 “기운을 보완해주는 공간”을 쓰면 확 올라가요.`,
    `${lowElem} 기운이 약하면 그 성질을 가진 환경을 일부러 쓰는 게 좋수다.`,
    `예: 목이 약하면 초록/자연/산책, 화가 약하면 햇빛/따뜻함/활동성, 금이 약하면 정리/규칙/도구, 토가 약하면 루틴/기초체력, 수가 약하면 휴식/물가/유연함.`,
    `가장 쉬운 건 집/책상 배치부터요. 작은 변화가 큰 운을 부르더이다.`,
    `주모는 “남쪽/밝은 곳”도 한 번 추천해보고 싶구먼요.`
  ];

  const summary = [
    `마지막으로 한마디만 더 하겠수다, ${who}.`,
    `사주는 “정해진 운명표”가 아니라, **힘이 어디로 쏠렸는지 보여주는 지도**요.`,
    `강한 기운은 무기고, 약한 기운은 숙제인데… 숙제는 습관으로 풀면 됩니다.`,
    `오늘부터 딱 하나만 하슈: “작게 시작해서, 밖으로 내놓기”.`,
    `에그머니나, 이 주모가 응원 안 하면 누가 하겠수. 한 잔 더 하고 가슈 🍶`
  ];

  return [
    { icon: "✨", title: "한눈에 보는 기운, 크게 흐르는 물줄기", body: longBody(intro) },
    { icon: "🧭", title: "전체 프레임, 쏠림이 강하면 방향이 복이다", body: longBody(frame) },
    { icon: "🧠", title: "성격·기질, 유연함 속에 단단한 기준", body: longBody(personality) },
    { icon: "🧱", title: "일·커리어, 깊게 파는 사람이 결국 이긴다", body: longBody(work) },
    { icon: "💰", title: "재물운, 돈은 흐르고 모으는 건 둑이다", body: longBody(money) },
    { icon: "💞", title: "인연운, 속도 조절만 되면 복이 붙는다", body: longBody(love) },
    { icon: "🏠", title: "가족·뿌리, 기대를 짊어지는 손님의 기운", body: longBody(family) },
    { icon: "🌿", title: "건강·생활, 몸이 풀리면 운도 풀린다", body: longBody(health) },
    { icon: "🗺️", title: "이동·환경, 부족한 기운은 공간으로 채운다", body: longBody(move) },
    { icon: "🍶", title: "주모의 한마디, 작은 실행이 큰 복을 부른다", body: longBody(summary) },
  ];
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok:false, error:{ code:'METHOD_NOT_ALLOWED', message:'POST로만 받수다.' }});
  }

  let body = null;
  try { body = JSON.parse(event.body || '{}'); } catch (_) { body = null; }
  if (!body) return badRequest('BAD_JSON', '요청 형식이 이상하수다.');

  const name = (typeof body.name === 'string' && body.name.trim().length) ? body.name.trim().slice(0, 30) : null;
  const calendar = body.calendar === 'lunar' ? 'lunar' : 'solar';
  const isLeapMonth = !!body.isLeapMonth;
  const ymd = parseYmd(body.birthDate);
  if (!ymd) return badRequest('BAD_BIRTHDATE', '생년월일(YYYY-MM-DD)을 확인해주슈.');
  const hm = parseHm(body.birthTime);
  const sex = (body.sex === 'M' || body.sex === 'F') ? body.sex : null;
  const timezone = body.timezone || 'Asia/Seoul';

  try {
    const { pillars, details, meta, relations } = calcPillars({ calendar, isLeapMonth, ymd, hm });

    const readingSections = makeReadingSections({ name, sex, pillars, meta, details, relations });

    // also keep a plain readingText for backward compatibility
    const readingText = readingSections.map(s => `${s.icon} ${s.title}\n${s.body}`).join('\n\n');

    return json(200, {
      ok: true,
      version: 'calc_v3',
      data: {
        pillars,
        details,
        relations,
        meta: {
          calendarUsed: meta.calendarUsed,
          solarDate: meta.solarDate,
          lunarDate: meta.lunarDate,
          isLeapMonth: meta.isLeapMonth,
          timeText: meta.timeText,
          timeKnown: meta.timeKnown,
          timezone
        },
        readingSections,
        readingText
      }
    });
  } catch (e) {
    return json(500, { ok:false, error:{ code:'INTERNAL_ERROR', message: e?.message || '서버 오류가 났수다.' }});
  }
};
