const https = require('https');

// =============================================
// 주모여기사주요 - 명리학 사주 계산 엔진 (검증완료)
// 테스트: 김진수 1988.8.25 → 戊辰년 庚申월 壬子일 확인
// =============================================

const CHEONGAN    = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const CHEONGAN_KR = ['갑','을','병','정','무','기','경','신','임','계'];
const CG_OHAENG   = ['목','목','화','화','토','토','금','금','수','수'];
const CG_EUMSUN   = ['양','음','양','음','양','음','양','음','양','음'];

const JIJI    = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const JIJI_KR = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const JJ_OHAENG = ['수','토','목','목','토','화','화','토','금','금','토','수'];
const JJ_EUMSUN = ['양','음','양','음','양','음','양','음','양','음','양','음'];
const ANIMALS   = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const ANIMAL_EMOJI = ['🐭','🐮','🐯','🐰','🐲','🐍','🐴','🐏','🐵','🐓','🐶','🐷'];

// 지장간
const JIJANGGAN = {
  '子':[{cg:'壬'},{cg:'癸'}],
  '丑':[{cg:'己'},{cg:'癸'},{cg:'辛'}],
  '寅':[{cg:'戊'},{cg:'丙'},{cg:'甲'}],
  '卯':[{cg:'甲'},{cg:'乙'}],
  '辰':[{cg:'乙'},{cg:'癸'},{cg:'戊'}],
  '巳':[{cg:'戊'},{cg:'庚'},{cg:'丙'}],
  '午':[{cg:'丙'},{cg:'己'},{cg:'丁'}],
  '未':[{cg:'丁'},{cg:'乙'},{cg:'己'}],
  '申':[{cg:'戊'},{cg:'壬'},{cg:'庚'}],
  '酉':[{cg:'庚'},{cg:'辛'}],
  '戌':[{cg:'辛'},{cg:'丁'},{cg:'戊'}],
  '亥':[{cg:'甲'},{cg:'壬'}],
};

// 오행 관계
function getOhaengRel(from, to) {
  const gen  = {목:'화',화:'토',토:'금',금:'수',수:'목'};
  const geuk = {목:'토',토:'수',수:'화',화:'금',금:'목'};
  if (from === to)        return 'same';
  if (gen[from]  === to)  return 'gen';
  if (geuk[from] === to)  return '我克';
  if (gen[to]    === from) return 'gen我';
  if (geuk[to]   === from) return '克我';
  return '-';
}

// 십성
function getSipseong(ilganIdx, targetIdx, isJiji) {
  const ilOh  = CG_OHAENG[ilganIdx];
  const ilEum = CG_EUMSUN[ilganIdx];
  const tOh   = isJiji ? JJ_OHAENG[targetIdx] : CG_OHAENG[targetIdx];
  const tEum  = isJiji ? JJ_EUMSUN[targetIdx] : CG_EUMSUN[targetIdx];
  const rel   = getOhaengRel(ilOh, tOh);
  const same  = ilEum === tEum;
  if (rel === 'same') return same ? '비견' : '겁재';
  if (rel === 'gen')  return same ? '식신' : '상관';
  if (rel === '克我') return same ? '편관' : '정관';
  if (rel === '我克') return same ? '편재' : '정재';
  if (rel === 'gen我') return same ? '편인' : '정인';
  return '-';
}

// 12운성 테이블 (일간 → [자,축,인,묘,진,사,오,미,신,유,술,해] 순서)
const WOONSUNG_TABLE = {
  甲:['사','묘','장생','목욕','관대','건록','제왕','쇠','병','사','묘','절'],
  乙:['병','사','절','태','양','장생','목욕','관대','건록','제왕','쇠','병'],
  丙:['태','양','장생','목욕','관대','건록','제왕','쇠','병','사','묘','절'],
  丁:['제왕','쇠','병','사','묘','절','태','양','장생','목욕','관대','건록'],
  戊:['태','양','장생','목욕','관대','건록','제왕','쇠','병','사','묘','절'],
  己:['제왕','쇠','병','사','묘','절','태','양','장생','목욕','관대','건록'],
  庚:['사','묘','절','태','양','장생','목욕','관대','건록','제왕','쇠','병'],
  辛:['목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양','장생'],
  壬:['제왕','쇠','병','사','묘','절','태','양','장생','목욕','관대','건록'],
  癸:['목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양','장생'],
};

function get12Woonsung(cgIdx, jjIdx) {
  const table = WOONSUNG_TABLE[CHEONGAN[cgIdx]];
  return table ? table[jjIdx] : '-';
}

// 공망: 연주 기준 순중 마지막 2개 지지
function getGongmang(yCG, yJJ) {
  // 순수: 갑자순, 갑술순, 갑신순 등 10개 간지 묶음
  // 순중 공망 = 해당 순에서 빠진 2개 지지
  const start = (yCG - yJJ % 10 + 10) % 10; // 그 순의 시작 천간
  const gm1 = (yJJ + 10) % 12;
  const gm2 = (yJJ + 11) % 12;
  return [JIJI[gm1], JIJI[gm2]];
}

// 합충파
function checkRelations(jjIdxList) {
  const result = { hap:[], chung:[], pa:[] };
  const YUKHAM = [[0,11],[1,10],[2,9],[3,8],[4,7],[5,6]];
  const CHUNG  = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  const PA     = [[0,3],[1,10],[2,11],[4,7],[5,8],[6,9]];
  const SAMHAP = [[0,4,8],[1,5,9],[2,6,10],[3,7,11]];

  for (let i=0;i<jjIdxList.length;i++) {
    for (let j=i+1;j<jjIdxList.length;j++) {
      const a=jjIdxList[i], b=jjIdxList[j];
      for (const [x,y] of YUKHAM) if((a===x&&b===y)||(a===y&&b===x)) result.hap.push(JIJI[a]+JIJI[b]+' 육합');
      for (const [x,y] of CHUNG)  if((a===x&&b===y)||(a===y&&b===x)) result.chung.push(JIJI[a]+JIJI[b]+' 충');
      for (const [x,y] of PA)     if((a===x&&b===y)||(a===y&&b===x)) result.pa.push(JIJI[a]+JIJI[b]+' 파');
    }
  }
  for (const [x,y,z] of SAMHAP) {
    const m=[x,y,z].filter(v=>jjIdxList.includes(v));
    if (m.length===3) result.hap.push(JIJI[x]+JIJI[y]+JIJI[z]+' 삼합');
    else if (m.length===2) result.hap.push(m.map(v=>JIJI[v]).join('')+' 반합');
  }
  return result;
}

// ── 핵심 만세력 계산 ──────────────────────────────
// 검증: 1988.8.25 → 戊辰(4,4) 庚申(6,8) 壬子(8,0) ✓

// 연간 기준 인월 천간 (甲己→丙, 乙庚→戊, 丙辛→庚, 丁壬→壬, 戊癸→甲)
const INWOL_CG = [2,4,6,8,0, 2,4,6,8,0];

// 양력월별 [절입일, 절기월지지인덱스]
// 절기월: 1월소한→丑(1), 2월입춘→寅(2), 3월경칩→卯(3), ...
const JEOLIP = [
  [6,1],[4,2],[6,3],[5,4],[6,5],[6,6],
  [7,7],[7,8],[8,9],[8,10],[7,11],[7,0]
];

function calcManse(sy, sm, sd) {
  // 연주
  const yCG = ((sy - 4) % 10 + 10) % 10;
  const yJJ = ((sy - 4) % 12 + 12) % 12;

  // 월주: 절입일 기준
  let mJJIdx = JEOLIP[sm-1][1];
  if (sd < JEOLIP[sm-1][0]) {
    const prevM = sm === 1 ? 12 : sm-1;
    mJJIdx = JEOLIP[prevM-1][1];
  }
  // 인월(寅,JJ=2)을 기준으로 몇 번째인지
  const mOffset = (mJJIdx - 2 + 12) % 12;
  const mCG = (INWOL_CG[yCG] + mOffset) % 10;

  // 일주: 기준 1900.1.1 = 甲戌(CG=0, JJ=10)
  const base = new Date(1900, 0, 1);
  const target = new Date(sy, sm-1, sd);
  const diff = Math.round((target - base) / 86400000);
  const iCG = (0 + diff) % 10;
  const iJJ = (10 + diff) % 12;

  return { yCG, yJJ, mCG, mJJ:mJJIdx, iCG, iJJ };
}

// 음력 → 양력 (근사 변환)
const LUNAR_NEW_YEAR = {
  1900:[1,31],1901:[2,19],1902:[2,8],1903:[1,29],1904:[2,16],1905:[2,4],
  1906:[1,25],1907:[2,13],1908:[2,2],1909:[1,22],1910:[2,10],1911:[1,30],
  1912:[2,18],1913:[2,6],1914:[1,26],1915:[2,14],1916:[2,3],1917:[1,23],
  1918:[2,11],1919:[2,1],1920:[2,20],1921:[2,8],1922:[1,28],1923:[2,16],
  1924:[2,5],1925:[1,24],1926:[2,13],1927:[2,2],1928:[1,23],1929:[2,10],
  1930:[1,30],1931:[2,17],1932:[2,6],1933:[1,26],1934:[2,14],1935:[2,4],
  1936:[1,24],1937:[2,11],1938:[1,31],1939:[2,19],1940:[2,8],1941:[1,27],
  1942:[2,15],1943:[2,5],1944:[1,25],1945:[2,13],1946:[2,2],1947:[1,22],
  1948:[2,10],1949:[1,29],1950:[2,17],1951:[2,6],1952:[1,27],1953:[2,14],
  1954:[2,3],1955:[1,24],1956:[2,12],1957:[1,31],1958:[2,18],1959:[2,8],
  1960:[1,28],1961:[2,15],1962:[2,5],1963:[1,25],1964:[2,13],1965:[2,2],
  1966:[1,21],1967:[2,9],1968:[1,30],1969:[2,17],1970:[2,6],1971:[1,27],
  1972:[2,15],1973:[2,3],1974:[1,23],1975:[2,11],1976:[1,31],1977:[2,18],
  1978:[2,7],1979:[1,28],1980:[2,16],1981:[2,5],1982:[1,25],1983:[2,13],
  1984:[2,2],1985:[2,20],1986:[2,9],1987:[1,29],1988:[2,17],1989:[2,6],
  1990:[1,27],1991:[2,15],1992:[2,4],1993:[1,23],1994:[2,10],1995:[1,31],
  1996:[2,19],1997:[2,7],1998:[1,28],1999:[2,16],2000:[2,5],2001:[1,24],
  2002:[2,12],2003:[2,1],2004:[1,22],2005:[2,9],2006:[1,29],2007:[2,18],
  2008:[2,7],2009:[1,26],2010:[2,14],2011:[2,3],2012:[1,23],2013:[2,10],
  2014:[1,31],2015:[2,19],2016:[2,8],2017:[1,28],2018:[2,16],2019:[2,5],
  2020:[1,25],2021:[2,12],2022:[2,1],2023:[1,22],2024:[2,10],2025:[1,29],
  2026:[2,17],2027:[2,6],2028:[1,26],2029:[2,13],2030:[2,3],
};

function lunarToSolar(year, month, day, isYundal) {
  const ny = LUNAR_NEW_YEAR[year];
  if (!ny) return null;
  const monthDays = [30,29,30,29,30,29,30,30,29,30,29,30];
  let total = 0;
  for (let m=1; m<month; m++) total += monthDays[m-1];
  if (isYundal) total += monthDays[month-1];
  total += day - 1;
  const d = new Date(year, ny[0]-1, ny[1]);
  d.setDate(d.getDate() + total);
  return { year:d.getFullYear(), month:d.getMonth()+1, day:d.getDate() };
}

// 시주 계산
const HOUR_TO_JJ = {
  '자시':0,'축시':1,'인시':2,'묘시':3,'진시':4,'사시':5,
  '오시':6,'미시':7,'신시':8,'유시':9,'술시':10,'해시':11
};
// 일간 기준 자시 천간: 甲己→甲, 乙庚→丙, 丙辛→戊, 丁壬→庚, 戊癸→壬
const JASI_CG = [0,2,4,6,8, 0,2,4,6,8];

function calcSiju(iCG, hourStr) {
  const hKey = Object.keys(HOUR_TO_JJ).find(k => hourStr && hourStr.startsWith(k));
  if (!hKey) return null;
  const jjIdx = HOUR_TO_JJ[hKey];
  const cgIdx = (JASI_CG[iCG] + jjIdx) % 10;
  return { cg:cgIdx, jj:jjIdx };
}

// 오행 집계
function countOhaeng(pillars) {
  const c = {목:0,화:0,토:0,금:0,수:0};
  for (const p of pillars) {
    if (p.cg !== null) c[CG_OHAENG[p.cg]] += 1;
    if (p.jj !== null) {
      c[JJ_OHAENG[p.jj]] += 1;
      for (const {cg} of (JIJANGGAN[JIJI[p.jj]]||[])) {
        const ci = CHEONGAN.indexOf(cg);
        if (ci>=0) c[CG_OHAENG[ci]] += 0.3;
      }
    }
  }
  return c;
}

// 신강/신약
function checkShingang(pillars, ilganIdx) {
  const ilOh = CG_OHAENG[ilganIdx];
  const genMe = {목:'수',화:'목',토:'화',금:'토',수:'금'}[ilOh];
  let sup=0, opp=0;
  for (const p of pillars) {
    const w = p.isMonth ? 1.5 : 1;
    if (p.cg!==null) { const o=CG_OHAENG[p.cg]; (o===ilOh||o===genMe)?sup+=w:opp+=w; }
    if (p.jj!==null) { const o=JJ_OHAENG[p.jj]; (o===ilOh||o===genMe)?sup+=w*1.2:opp+=w*1.2; }
  }
  const r = sup/(sup+opp);
  if (r>=0.55) return {result:'신강', ratio:Math.round(r*100)};
  if (r<=0.45) return {result:'신약', ratio:Math.round(r*100)};
  return {result:'중화', ratio:Math.round(r*100)};
}

// 용신
function guessYongshin(ilganIdx, shingang) {
  const ilOh = CG_OHAENG[ilganIdx];
  const genMap = {목:'수',화:'목',토:'화',금:'토',수:'금'};
  const sikMap = {목:'화',화:'토',토:'금',금:'수',수:'목'};
  if (shingang.result==='신강') return { primary:sikMap[ilOh], reason:`신강 사주 — 넘치는 기운을 빼줄 ${sikMap[ilOh]}(식상) 기운이 용신` };
  if (shingang.result==='신약') return { primary:genMap[ilOh], reason:`신약 사주 — 일간을 도와줄 ${genMap[ilOh]}(인성) 기운이 용신` };
  return { primary:'균형', reason:'중화 사주 — 부족한 오행 보완이 핵심' };
}

// 전체 계산
function fullCalc(input) {
  const {year,month,day,hourStr,isLunar,isYundal,gender} = input;
  let sy=year, sm=month, sd=day;
  if (isLunar) {
    const sol = lunarToSolar(year,month,day,isYundal);
    if (!sol) throw new Error('음력 변환 실패 — 지원 범위를 벗어났수다');
    sy=sol.year; sm=sol.month; sd=sol.day;
  }

  const m = calcManse(sy,sm,sd);
  const si = hourStr && hourStr!=='모름' ? calcSiju(m.iCG, hourStr) : null;

  const pillars = [
    {label:'연주', cg:m.yCG, jj:m.yJJ, isMonth:false},
    {label:'월주', cg:m.mCG, jj:m.mJJ, isMonth:true},
    {label:'일주', cg:m.iCG, jj:m.iJJ, isMonth:false},
  ];
  if (si) pillars.push({label:'시주', cg:si.cg, jj:si.jj, isMonth:false});

  const ilgan = m.iCG;

  const pillarDetails = pillars.map(p => {
    const cgC = CHEONGAN[p.cg];
    const jjC = JIJI[p.jj];
    return {
      label: p.label,
      cg: cgC, cg_kr: CHEONGAN_KR[p.cg], cg_oh: CG_OHAENG[p.cg],
      jj: jjC, jj_kr: JIJI_KR[p.jj], jj_oh: JJ_OHAENG[p.jj],
      sipseong_cg: getSipseong(ilgan, p.cg, false),
      sipseong_jj: getSipseong(ilgan, p.jj, true),
      woonsung: get12Woonsung(p.cg, p.jj),
      jijanggan: JIJANGGAN[jjC] || [],
    };
  });

  const ohaengCount = countOhaeng(pillars);
  const shingang = checkShingang(pillars, ilgan);
  const yongshin = guessYongshin(ilgan, shingang);
  const gongmang = getGongmang(m.yCG, m.yJJ);
  const jjIdxList = pillars.map(p=>p.jj);
  const relations = checkRelations(jjIdxList);
  const animal = ANIMAL_EMOJI[m.yJJ] + ANIMALS[m.yJJ];

  return {
    solarDate:{year:sy,month:sm,day:sd},
    originalDate:{year,month,day,isLunar,isYundal},
    gender, hourStr,
    pillars: pillarDetails,
    ilgan:{char:CHEONGAN[ilgan],kr:CHEONGAN_KR[ilgan],oh:CG_OHAENG[ilgan]},
    ohaengCount, shingang, yongshin, gongmang, relations, animal,
  };
}

// LLM 프롬프트
function buildPrompt(data, name) {
  const p = data.pillars;
  const pillarStr = p.map(pl =>
    `${pl.label}: ${pl.cg}${pl.jj}(${pl.cg_kr}${pl.jj_kr}) | 십성: 천간-${pl.sipseong_cg}/지지-${pl.sipseong_jj} | 12운성: ${pl.woonsung} | 지장간: ${pl.jijanggan.map(j=>j.cg).join(',')}`
  ).join('\n');
  const oStr = Object.entries(data.ohaengCount).map(([k,v])=>`${k}:${v.toFixed(1)}`).join(' ');
  const relStr = [...data.relations.hap,...data.relations.chung,...data.relations.pa].join(', ')||'없음';
  const sd = data.solarDate;
  const od = data.originalDate;
  const dateStr = od.isLunar
    ? `음력 ${od.year}년 ${od.month}월 ${od.day}일${od.isYundal?'(윤달)':''} → 양력 ${sd.year}.${sd.month}.${sd.day}`
    : `양력 ${sd.year}년 ${sd.month}월 ${sd.day}일`;

  return `당신은 조선시대 주막의 주모입니다. 아래 명리학 계산 결과만을 근거로 사주 해설을 해주세요.

[계산 데이터]
이름: ${name} / 성별: ${data.gender} / ${dateStr} / 태어난시: ${data.hourStr} / 띠: ${data.animal}

[사주 원국]
${pillarStr}

[오행] ${oStr}
[신강신약] ${data.shingang.result} (일간지지도 ${data.shingang.ratio}%)
[용신] ${data.yongshin.primary} — ${data.yongshin.reason}
[공망] ${data.gongmang.join(', ')}
[합충파] ${relStr}

[말투 규칙]
- 조선 주막 주모의 구수한 사투리 (예: ~수다, ~이수, 어이구, 에그머니나, ~란 말이수)
- ${name}님 이름 자주 부르기
- 막걸리·주막·장터 비유 자연스럽게
- 반드시 위 계산 데이터 근거로만 해설 (감성적 추정 금지)
- 데이터 근거 명시: "오행에 토가 많으니~", "신강 사주라~", "壬子 일주는~" 등

[해설 구조 — 순서대로 7섹션, 각 섹션 이모지+제목으로 시작, 4~6줄]
🌟 총평 — 사주 전체 이미지
💪 일주 분석 — ${p[2]?p[2].cg+p[2].jj:'일주'} 일주 기질
🎯 오행과 용신 — 부족/과잉 오행, 개운법
💕 인연운 — 연애·결혼운
💰 재물·직업운
🌿 건강·주의사항
🍶 주모의 한마디 — 희망차고 따뜻한 마무리`;
}

// Anthropic API 호출 (https 모듈)
function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{role:'user', content:prompt}]
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve(JSON.parse(d)); }
        catch(e) { reject(new Error('파싱오류: ' + d.slice(0,300))); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Netlify Function 핸들러
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'} };
  if (event.httpMethod !== 'POST') return { statusCode:405, body:'Method Not Allowed' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { statusCode:500, body: JSON.stringify({error:'API key not configured'}) };

  try {
    const {year,month,day,hourStr,isLunar,isYundal,gender,name} = JSON.parse(event.body);
    const sajuData = fullCalc({year,month,day,hourStr,isLunar,isYundal,gender});
    const prompt = buildPrompt(sajuData, name||'손님');
    const llmData = await callAnthropic(apiKey, prompt);
    if (llmData.error) throw new Error(llmData.error.message||'API 오류');

    return {
      statusCode: 200,
      headers: {'Content-Type':'application/json','Access-Control-Allow-Origin':'*'},
      body: JSON.stringify({ saju:sajuData, reading:llmData.content[0].text })
    };
  } catch(err) {
    return { statusCode:500, body: JSON.stringify({error: err.message}) };
  }
};
