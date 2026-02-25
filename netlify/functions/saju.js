// =============================================
// 주모여기사주요 - 명리학 사주 계산 엔진
// =============================================

// 천간 (天干)
const CHEONGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const CHEONGAN_KR = ['갑','을','병','정','무','기','경','신','임','계'];
const CG_OHAENG = ['목','목','화','화','토','토','금','금','수','수'];
const CG_EUMSUN = ['양','음','양','음','양','음','양','음','양','음'];

// 지지 (地支)
const JIJI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const JIJI_KR = ['자','축','인','묘','진','사','오','미','신','유','술','해'];
const JJ_OHAENG = ['수','토','목','목','토','화','화','토','금','금','토','수'];
const JJ_EUMSUN = ['양','음','양','음','양','음','양','음','양','음','양','음'];
const ANIMALS = ['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
const ANIMAL_EMOJI = ['🐭','🐮','🐯','🐰','🐲','🐍','🐴','🐏','🐵','🐓','🐶','🐷'];

// 지장간 (支藏干) - 각 지지에 숨어있는 천간
const JIJANGGAN = {
  '子': [{cg:'壬',ratio:0.33},{cg:'癸',ratio:0.67}],
  '丑': [{cg:'己',ratio:0.6},{cg:'癸',ratio:0.2},{cg:'辛',ratio:0.2}],
  '寅': [{cg:'戊',ratio:0.2},{cg:'丙',ratio:0.2},{cg:'甲',ratio:0.6}],
  '卯': [{cg:'甲',ratio:0.33},{cg:'乙',ratio:0.67}],
  '辰': [{cg:'乙',ratio:0.2},{cg:'癸',ratio:0.2},{cg:'戊',ratio:0.6}],
  '巳': [{cg:'戊',ratio:0.2},{cg:'庚',ratio:0.2},{cg:'丙',ratio:0.6}],
  '午': [{cg:'丙',ratio:0.33},{cg:'己',ratio:0.1},{cg:'丁',ratio:0.57}],
  '未': [{cg:'丁',ratio:0.2},{cg:'乙',ratio:0.2},{cg:'己',ratio:0.6}],
  '申': [{cg:'戊',ratio:0.2},{cg:'壬',ratio:0.2},{cg:'庚',ratio:0.6}],
  '酉': [{cg:'庚',ratio:0.33},{cg:'辛',ratio:0.67}],
  '戌': [{cg:'辛',ratio:0.2},{cg:'丁',ratio:0.2},{cg:'戊',ratio:0.6}],
  '亥': [{cg:'甲',ratio:0.2},{cg:'壬',ratio:0.2},{cg:'壬',ratio:0.6}],
};

// 십성 (十星) - 일간 기준
function getSipseong(ilgan_idx, target_idx, isJiji) {
  const ilgan_oh = CG_OHAENG[ilgan_idx];
  const ilgan_eum = CG_EUMSUN[ilgan_idx];
  const target_oh = isJiji ? JJ_OHAENG[target_idx] : CG_OHAENG[target_idx];
  const target_eum = isJiji ? JJ_EUMSUN[target_idx] : CG_EUMSUN[target_idx];

  const ohRel = getOhaengRel(ilgan_oh, target_oh);
  const samEum = ilgan_eum === target_eum;

  if (ohRel === 'same') return samEum ? '비견' : '겁재';
  if (ohRel === 'gen')  return samEum ? '식신' : '상관';
  if (ohRel === '克我') return samEum ? '편관' : '정관';
  if (ohRel === '我克') return samEum ? '편재' : '정재';
  if (ohRel === 'gen我') return samEum ? '편인' : '정인';
  return '-';
}

function getOhaengRel(from, to) {
  const gen = {'목':'화','화':'토','토':'금','금':'수','수':'목'};
  const geukMap = {'목':'토','토':'수','수':'화','화':'금','금':'목'};
  if (from === to) return 'same';
  if (gen[from] === to) return 'gen';
  if (geukMap[from] === to) return '我克';
  if (gen[to] === from) return 'gen我';
  if (geukMap[to] === from) return '克我';
  return '-';
}

// 12운성 (十二運星)
const WOONSUNG_TABLE = {
  '甲': ['사','묘','절','태','양','장생','목욕','관대','건록','제왕','쇠','병'],
  '乙': ['사','오','미','신','유','술','해','자','축','인','묘','진'],
  '丙': ['유','술','해','자','축','인','묘','진','사','오','미','신'],
  '丁': ['유','신','미','오','사','진','묘','인','축','자','해','술'],
  '戊': ['유','술','해','자','축','인','묘','진','사','오','미','신'],
  '己': ['유','신','미','오','사','진','묘','인','축','자','해','술'],
  '庚': ['자','축','인','묘','진','사','오','미','신','유','술','해'],
  '辛': ['자','해','술','유','신','미','오','사','진','묘','인','축'],
  '壬': ['묘','인','축','자','해','술','유','신','미','오','사','진'],
  '癸': ['묘','진','사','오','미','신','유','술','해','자','축','인'],
};

const WOONSUNG_12 = ['장생','목욕','관대','건록','제왕','쇠','병','사','묘','절','태','양'];

function get12Woonsung(cg, jj) {
  const cgChar = CHEONGAN[cg];
  const jjChar = JIJI[jj];
  const table = WOONSUNG_TABLE[cgChar];
  if (!table) return '-';
  const idx = table.indexOf(JIJI_KR[jj]);
  return idx >= 0 ? WOONSUNG_12[idx] : '-';
}

// 공망 (空亡) 계산
function getGongmang(year_cg, year_jj) {
  // 연주 기준 순중 공망
  const base = (year_cg * 12 + year_jj) % 60;
  const gongmang_start = (year_jj - year_cg + 12) % 12;
  const gm1 = JIJI[(gongmang_start + 10) % 12];
  const gm2 = JIJI[(gongmang_start + 11) % 12];
  return [gm1, gm2];
}

// 합충형파 (合冲刑破)
const YUKHAM = [ // 육합
  [0,11],[1,10],[2,9],[3,8],[4,7],[5,6]
];
const SAMHAP = [ // 삼합
  [0,4,8],[1,5,9],[2,6,10],[3,7,11]
];
const CHUNG = [ // 육충 (자오충, 축미충, 인신충, 묘유충, 진술충, 사해충)
  [0,6],[1,7],[2,8],[3,9],[4,10],[5,11]
];
const HYEONG = [ // 형
  [2,5],[5,8],[2,8], // 인사신 삼형
  [1,10],[10,7],    // 축술미 삼형 (일부)
  [0,0],[3,3]       // 자형, 묘자형
];
const PA = [ // 파
  [0,3],[1,10],[2,11],[4,7],[5,8],[6,9]
];

function checkRelations(jj_list) {
  const result = { hap: [], chung: [], hyeong: [], pa: [] };
  const jjIdxList = jj_list.map(j => JIJI.indexOf(j)).filter(i => i >= 0);

  for (let i = 0; i < jjIdxList.length; i++) {
    for (let j = i+1; j < jjIdxList.length; j++) {
      const a = jjIdxList[i], b = jjIdxList[j];

      // 육합
      for (const [x,y] of YUKHAM) {
        if ((a===x&&b===y)||(a===y&&b===x)) {
          result.hap.push(`${JIJI[a]}${JIJI[b]} 육합`);
        }
      }
      // 육충
      for (const [x,y] of CHUNG) {
        if ((a===x&&b===y)||(a===y&&b===x)) {
          result.chung.push(`${JIJI[a]}${JIJI[b]} 충`);
        }
      }
      // 파
      for (const [x,y] of PA) {
        if ((a===x&&b===y)||(a===y&&b===x)) {
          result.pa.push(`${JIJI[a]}${JIJI[b]} 파`);
        }
      }
    }
  }

  // 삼합
  for (const [x,y,z] of SAMHAP) {
    const match = [x,y,z].filter(v => jjIdxList.includes(v));
    if (match.length === 3) result.hap.push(`${JIJI[x]}${JIJI[y]}${JIJI[z]} 삼합`);
    else if (match.length === 2) result.hap.push(`${match.map(v=>JIJI[v]).join('')} 반합`);
  }

  return result;
}

// 음력 → 양력 변환 (간단한 근사 테이블 방식)
// 실제 서비스에서는 전체 만세력 테이블 사용 필요
// 여기서는 1900~2030년 음력 1월 1일 양력 날짜 테이블 사용
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

// 음력 윤달 데이터 (간략)
const YUNDAL_TABLE = {
  '1900-8':true,'1903-5':true,'1906-4':true,'1909-2':true,'1911-6':true,
  '1914-5':true,'1917-2':true,'1919-7':true,'1922-5':true,'1925-4':true,
  '1928-2':true,'1930-6':true,'1933-5':true,'1936-3':true,'1938-7':true,
  '1941-6':true,'1944-4':true,'1947-2':true,'1949-7':true,'1952-5':true,
  '1955-3':true,'1957-8':true,'1960-6':true,'1963-4':true,'1966-3':true,
  '1968-7':true,'1971-5':true,'1974-4':true,'1976-8':true,'1979-6':true,
  '1982-4':true,'1985-8':true,'1987-6':true,'1990-5':true,'1993-3':true,
  '1995-8':true,'1998-5':true,'2001-4':true,'2004-2':true,'2006-7':true,
  '2009-5':true,'2012-4':true,'2014-9':true,'2017-6':true,'2020-4':true,
  '2023-2':true,'2025-6':true,'2028-5':true,
};

function lunarToSolar(year, month, day, isYundal) {
  // 음력 → 양력 근사 변환
  // 실제로는 정확한 만세력 테이블 필요하지만, 여기서는 근사값 사용
  const newYear = LUNAR_NEW_YEAR[year];
  if (!newYear) return null;

  // 음력 월별 일수 (평균)
  const monthDays = [30,29,30,29,30,29,30,30,29,30,29,30];

  let totalDays = 0;
  for (let m = 1; m < month; m++) {
    totalDays += monthDays[m-1];
    // 윤달 처리
    const ydKey = `${year}-${m}`;
    if (YUNDAL_TABLE[ydKey]) totalDays += 29;
  }
  if (isYundal) {
    totalDays += monthDays[month-1];
  }
  totalDays += day - 1;

  const solarDate = new Date(year, newYear[0]-1, newYear[1]);
  solarDate.setDate(solarDate.getDate() + totalDays);

  return {
    year: solarDate.getFullYear(),
    month: solarDate.getMonth() + 1,
    day: solarDate.getDate()
  };
}

// 절입일 (節入日) - 월주 계산에 필요
// 각 월 절기의 대략적인 양력 날짜
const JEOLGI_DAYS = [6,4,6,5,5,6,7,7,8,8,7,7]; // 월별 절입일 (대략)
const JEOLGI_MONTHS = [1,2,3,4,5,6,7,8,9,10,11,12]; // 절기 해당 양력 월

function getSolarMonth(solarYear, solarMonth, solarDay) {
  // 절입일 기준 월 결정
  const jeolgiDay = JEOLGI_DAYS[solarMonth-1];
  if (solarDay < jeolgiDay) {
    return solarMonth - 1 === 0 ? 12 : solarMonth - 1;
  }
  return solarMonth;
}

// 만세력 계산 메인 함수
function calcManse(solarYear, solarMonth, solarDay, hourStr) {
  // 연주 계산
  const y = solarYear - 4;
  const yeon_cg = ((y % 10) + 10) % 10;
  const yeon_jj = ((y % 12) + 12) % 12;

  // 월주 계산 (절입 기준)
  const mmonth = getSolarMonth(solarYear, solarMonth, solarDay);
  const totalMonths = (solarYear - 4) * 12 + (mmonth - 1);
  const wol_cg = ((totalMonths % 10) + 10) % 10;
  const wol_jj = ((totalMonths % 12) + 12) % 12;

  // 일주 계산
  const base = Math.floor((solarYear - 1900) * 365.25) +
               Math.floor((solarMonth - 1) * 30.44) + solarDay + 10;
  const il_cg = ((base % 10) + 10) % 10;
  const il_jj = ((base % 12) + 12) % 12;

  // 시주 계산
  const hourMap = {'자시':0,'축시':1,'인시':2,'묘시':3,'진시':4,'사시':5,
                   '오시':6,'미시':7,'신시':8,'유시':9,'술시':10,'해시':11};
  let si_cg = null, si_jj = null;
  const hk = Object.keys(hourMap).find(k => hourStr && hourStr.startsWith(k));
  if (hk !== undefined) {
    const siBase = base * 12 + hourMap[hk];
    si_cg = ((siBase % 10) + 10) % 10;
    si_jj = ((siBase % 12) + 12) % 12;
  }

  return { yeon_cg, yeon_jj, wol_cg, wol_jj, il_cg, il_jj, si_cg, si_jj };
}

// 오행 개수 집계
function countOhaeng(pillars, ilgan_idx) {
  const count = {목:0, 화:0, 토:0, 금:0, 수:0};

  for (const {cg, jj} of pillars) {
    if (cg !== null) count[CG_OHAENG[cg]] += 1;
    if (jj !== null) {
      count[JJ_OHAENG[jj]] += 1;
      // 지장간도 포함
      const jjChar = JIJI[jj];
      for (const {cg: jjg} of (JIJANGGAN[jjChar] || [])) {
        const cgIdx = CHEONGAN.indexOf(jjg);
        if (cgIdx >= 0) count[CG_OHAENG[cgIdx]] += 0.3;
      }
    }
  }

  return count;
}

// 신강/신약 판정
function checkShingang(pillars, ilgan_idx, ohaengCount) {
  const ilOh = CG_OHAENG[ilgan_idx];
  // 일간을 돕는 오행: 비겁(같은 오행), 인성(일간을 생하는 오행)
  const genMap = {목:'수',화:'목',토:'화',금:'토',수:'금'};
  const supportOh = genMap[ilOh];

  let supportScore = 0;
  let opposeScore = 0;

  for (const {cg, jj, isMonth} of pillars) {
    const weight = isMonth ? 1.5 : 1;
    if (cg !== null) {
      const oh = CG_OHAENG[cg];
      if (oh === ilOh || oh === supportOh) supportScore += weight;
      else opposeScore += weight;
    }
    if (jj !== null) {
      const oh = JJ_OHAENG[jj];
      if (oh === ilOh || oh === supportOh) supportScore += weight * 1.2;
      else opposeScore += weight * 1.2;
    }
  }

  const ratio = supportScore / (supportScore + opposeScore);
  if (ratio >= 0.55) return { result: '신강', ratio: Math.round(ratio*100) };
  if (ratio <= 0.45) return { result: '신약', ratio: Math.round(ratio*100) };
  return { result: '중화', ratio: Math.round(ratio*100) };
}

// 용신 1차 추정
function guessYongshin(ilgan_idx, ohaengCount, shingang) {
  const ilOh = CG_OHAENG[ilgan_idx];
  const genMap = {목:'수',화:'목',토:'화',금:'토',수:'금'};
  const geukMap2 = {목:'금',화:'수',토:'목',금:'화',수:'토'};

  if (shingang.result === '신강') {
    // 신강 → 식상/재성/관성으로 설기
    const 식상Oh = genMap[ilOh];
    return {
      primary: 식상Oh,
      reason: `신강 사주로 넘치는 기운을 빼줄 ${식상Oh}(식상) 기운이 용신`
    };
  } else if (shingang.result === '신약') {
    // 신약 → 인성/비겁으로 보강
    return {
      primary: genMap[ilOh] === ilOh ? ilOh : genMap[ilOh],
      reason: `신약 사주로 일간을 도와줄 ${genMap[ilOh]}(인성) 또는 비겁 기운이 용신`
    };
  } else {
    return {
      primary: '중화',
      reason: '중화 사주로 부족한 오행을 보완하는 것이 핵심'
    };
  }
}

// 전체 사주 계산
function fullCalc(input) {
  const { year, month, day, hourStr, isLunar, isYundal, gender } = input;

  let sy = year, sm = month, sd = day;

  // 음력 변환
  if (isLunar) {
    const solar = lunarToSolar(year, month, day, isYundal);
    if (!solar) throw new Error('음력 변환 실패');
    sy = solar.year; sm = solar.month; sd = solar.day;
  }

  const m = calcManse(sy, sm, sd, hourStr);

  const pillars = [
    { label:'연주', cg: m.yeon_cg, jj: m.yeon_jj, isMonth: false },
    { label:'월주', cg: m.wol_cg,  jj: m.wol_jj,  isMonth: true  },
    { label:'일주', cg: m.il_cg,   jj: m.il_jj,   isMonth: false },
  ];
  if (m.si_cg !== null) {
    pillars.push({ label:'시주', cg: m.si_cg, jj: m.si_jj, isMonth: false });
  }

  const ilgan = m.il_cg;

  // 각 기둥 상세 정보
  const pillarDetails = pillars.map(p => {
    const cgChar = p.cg !== null ? CHEONGAN[p.cg] : null;
    const jjChar = p.jj !== null ? JIJI[p.jj] : null;
    const ss_cg = p.cg !== null ? getSipseong(ilgan, p.cg, false) : null;
    const ss_jj = p.jj !== null ? getSipseong(ilgan, p.jj, true) : null;
    const ws = (p.cg !== null && p.jj !== null) ? get12Woonsung(p.cg, p.jj) : null;
    const jjg = jjChar ? JIJANGGAN[jjChar] : [];

    return {
      label: p.label,
      cg: cgChar,
      cg_kr: p.cg !== null ? CHEONGAN_KR[p.cg] : null,
      cg_oh: p.cg !== null ? CG_OHAENG[p.cg] : null,
      jj: jjChar,
      jj_kr: p.jj !== null ? JIJI_KR[p.jj] : null,
      jj_oh: p.jj !== null ? JJ_OHAENG[p.jj] : null,
      sipseong_cg: ss_cg,
      sipseong_jj: ss_jj,
      woonsung: ws,
      jijanggan: jjg,
    };
  });

  // 오행 집계
  const ohaengCount = countOhaeng(pillars, ilgan);

  // 신강/신약
  const shingang = checkShingang(pillars, ilgan, ohaengCount);

  // 용신
  const yongshin = guessYongshin(ilgan, ohaengCount, shingang);

  // 공망
  const gongmang = getGongmang(m.yeon_cg, m.yeon_jj);

  // 합충형파
  const jjList = pillars.map(p => p.jj !== null ? JIJI[p.jj] : null).filter(Boolean);
  const relations = checkRelations(jjList);

  // 띠
  const animal = ANIMALS[m.yeon_jj];
  const animalEmoji = ANIMAL_EMOJI[m.yeon_jj];

  return {
    solarDate: { year: sy, month: sm, day: sd },
    originalDate: { year, month, day, isLunar, isYundal },
    gender,
    hourStr,
    pillars: pillarDetails,
    ilgan: { char: CHEONGAN[ilgan], kr: CHEONGAN_KR[ilgan], oh: CG_OHAENG[ilgan] },
    ohaengCount,
    shingang,
    yongshin,
    gongmang,
    relations,
    animal: `${animalEmoji}${animal}`,
  };
}

// LLM 프롬프트 생성
function buildPrompt(data, name) {
  const p = data.pillars;
  const ohaeng = data.ohaengCount;

  const pillarStr = p.map(pl =>
    `${pl.label}: ${pl.cg}${pl.jj}(${pl.cg_kr}${pl.jj_kr}) | 십성: 천간${pl.sipseong_cg||'-'}/지지${pl.sipseong_jj||'-'} | 12운성: ${pl.woonsung||'-'} | 지장간: ${pl.jijanggan.map(j=>j.cg).join(',')||'-'}`
  ).join('\n');

  const ohaengStr = Object.entries(ohaeng).map(([k,v])=>`${k}:${v.toFixed(1)}`).join(' | ');

  const rel = data.relations;
  const relStr = [
    ...rel.hap.map(h=>`합(${h})`),
    ...rel.chung.map(c=>`충(${c})`),
    ...rel.pa.map(p=>`파(${p})`),
  ].join(', ') || '없음';

  return `당신은 조선시대 주막의 구수한 주모입니다. 아래 명리학 계산 결과를 바탕으로 사주 해설을 해주세요.

[계산 데이터 - 이 데이터에만 근거해서 해설할 것]
이름: ${name}
성별: ${data.gender}
양력: ${data.solarDate.year}년 ${data.solarDate.month}월 ${data.solarDate.day}일${data.originalDate.isLunar ? ` (음력 ${data.originalDate.year}년 ${data.originalDate.month}월 ${data.originalDate.day}일${data.originalDate.isYundal?'윤달':''})` : ''}
태어난시: ${data.hourStr}
띠: ${data.animal}

[사주 원국]
${pillarStr}

[오행 집계]
${ohaengStr}

[신강/신약] ${data.shingang.result} (일간 지지도 ${data.shingang.ratio}%)

[용신] ${data.yongshin.primary} - ${data.yongshin.reason}

[공망] ${data.gongmang.join(', ')}

[합충형파] ${relStr}

---
[말투 규칙 - 반드시 지킬 것]
- 조선 주막 주모의 구수한 사투리 말투
- 필수 표현: "~수다", "~이수", "어이구", "에그머니나", "허허", "아이구야", "어이~", "~란 말이수"
- ${name}님 이름을 자주 부르며 대화하듯 풀이
- 막걸리, 주막, 밥상, 장터 등 서민 생활 비유 자연스럽게
- 재미있고 유머있게, 하지만 진심 어린 따뜻한 조언 포함
- 감성적 추정 금지 - 반드시 위 계산 데이터에 근거해서만 해설
- 예: "오행에 ${Object.entries(ohaeng).sort((a,b)=>b[1]-a[1])[0][0]}이 많으니~", "신강 사주라서~", "${data.shingang.result} 사주이니~" 등

[풀이 구조 - 7섹션 순서대로, 각 섹션은 이모지+제목 한 줄로 시작]
🌟 첫인상과 총평
💪 타고난 기질과 성격 (일주 분석)
🎯 오행 분석과 용신
💕 인연운과 사랑운
💰 재물운과 직업운
🌿 건강운과 조언
🍶 주모의 한마디

각 섹션 4~6줄. 마지막은 희망차고 따뜻하게.`;
}

// Netlify Function 핸들러
exports.handler = async function(event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: {'Access-Control-Allow-Origin':'*'} };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'API key not configured' }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { year, month, day, hourStr, isLunar, isYundal, gender, name } = body;

    // 사주 계산
    const sajuData = fullCalc({ year, month, day, hourStr, isLunar, isYundal, gender });

    // LLM 해설 요청
    const prompt = buildPrompt(sajuData, name || '손님');

    const llmRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const llmData = await llmRes.json();
    if (!llmRes.ok) throw new Error((llmData.error && llmData.error.message) || '오류 ' + llmRes.status);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        saju: sajuData,
        reading: llmData.content[0].text
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
