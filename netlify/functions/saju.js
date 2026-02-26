const https = require('https');

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

const JIJANGGAN = {
  '子':[{cg:'壬'},{cg:'癸'}],'丑':[{cg:'己'},{cg:'癸'},{cg:'辛'}],
  '寅':[{cg:'戊'},{cg:'丙'},{cg:'甲'}],'卯':[{cg:'甲'},{cg:'乙'}],
  '辰':[{cg:'乙'},{cg:'癸'},{cg:'戊'}],'巳':[{cg:'戊'},{cg:'庚'},{cg:'丙'}],
  '午':[{cg:'丙'},{cg:'己'},{cg:'丁'}],'未':[{cg:'丁'},{cg:'乙'},{cg:'己'}],
  '申':[{cg:'戊'},{cg:'壬'},{cg:'庚'}],'酉':[{cg:'庚'},{cg:'辛'}],
  '戌':[{cg:'辛'},{cg:'丁'},{cg:'戊'}],'亥':[{cg:'甲'},{cg:'壬'}],
};

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

const INWOL_CG = [2,4,6,8,0,2,4,6,8,0];
const JEOLIP   = [[6,1],[4,2],[6,3],[5,4],[6,5],[6,6],[7,7],[7,8],[8,9],[8,10],[7,11],[7,0]];

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

function getOhaengRel(from,to){
  const gen={목:'화',화:'토',토:'금',금:'수',수:'목'};
  const geuk={목:'토',토:'수',수:'화',화:'금',금:'목'};
  if(from===to)return 'same';if(gen[from]===to)return 'gen';
  if(geuk[from]===to)return '我克';if(gen[to]===from)return 'gen我';
  if(geuk[to]===from)return '克我';return '-';
}
function getSipseong(il,t,isJ){
  const iO=CG_OHAENG[il],iE=CG_EUMSUN[il];
  const tO=isJ?JJ_OHAENG[t]:CG_OHAENG[t],tE=isJ?JJ_EUMSUN[t]:CG_EUMSUN[t];
  const r=getOhaengRel(iO,tO),s=iE===tE;
  if(r==='same')return s?'비견':'겁재';if(r==='gen')return s?'식신':'상관';
  if(r==='克我')return s?'편관':'정관';if(r==='我克')return s?'편재':'정재';
  if(r==='gen我')return s?'편인':'정인';return '-';
}
function get12Woonsung(c,j){const t=WOONSUNG_TABLE[CHEONGAN[c]];return t?t[j]:'-';}
function getGongmang(yC,yJ){return[JIJI[(yJ+10)%12],JIJI[(yJ+11)%12]];}
function checkRelations(jjList){
  const res={hap:[],chung:[],pa:[]};
  const YH=[[0,11],[1,10],[2,9],[3,8],[4,7],[5,6]];
  const CH=[[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  const PA=[[0,3],[1,10],[2,11],[4,7],[5,8],[6,9]];
  const SH=[[0,4,8],[1,5,9],[2,6,10],[3,7,11]];
  for(let i=0;i<jjList.length;i++)for(let j=i+1;j<jjList.length;j++){
    const a=jjList[i],b=jjList[j];
    for(const[x,y]of YH)if((a===x&&b===y)||(a===y&&b===x))res.hap.push(JIJI[a]+JIJI[b]+' 육합');
    for(const[x,y]of CH)if((a===x&&b===y)||(a===y&&b===x))res.chung.push(JIJI[a]+JIJI[b]+' 충');
    for(const[x,y]of PA)if((a===x&&b===y)||(a===y&&b===x))res.pa.push(JIJI[a]+JIJI[b]+' 파');
  }
  for(const[x,y,z]of SH){const m=[x,y,z].filter(v=>jjList.includes(v));
    if(m.length===3)res.hap.push(JIJI[x]+JIJI[y]+JIJI[z]+' 삼합');
    else if(m.length===2)res.hap.push(m.map(v=>JIJI[v]).join('')+' 반합');}
  return res;
}
function lunarToSolar(year,month,day,isYundal){
  const ny=LUNAR_NEW_YEAR[year];if(!ny)return null;
  const md=[30,29,30,29,30,29,30,30,29,30,29,30];
  let total=0;for(let m=1;m<month;m++)total+=md[m-1];
  if(isYundal)total+=md[month-1];total+=day-1;
  const d=new Date(year,ny[0]-1,ny[1]);d.setDate(d.getDate()+total);
  return{year:d.getFullYear(),month:d.getMonth()+1,day:d.getDate()};
}

const JASI_CG=[0,2,4,6,8,0,2,4,6,8];
const HOUR_TO_JJ={'자시':0,'축시':1,'인시':2,'묘시':3,'진시':4,'사시':5,'오시':6,'미시':7,'신시':8,'유시':9,'술시':10,'해시':11};

function fullCalc(input){
  const{year,month,day,hourStr,isLunar,isYundal,gender}=input;
  let sy=year,sm=month,sd=day;
  if(isLunar){const sol=lunarToSolar(year,month,day,isYundal);if(!sol)throw new Error('음력 변환 실패');sy=sol.year;sm=sol.month;sd=sol.day;}
  const yCG=((sy-4)%10+10)%10,yJJ=((sy-4)%12+12)%12;
  let mJJ=JEOLIP[sm-1][1];
  if(sd<JEOLIP[sm-1][0]){const p=sm===1?12:sm-1;mJJ=JEOLIP[p-1][1];}
  const mOff=(mJJ-2+12)%12,mCG=(INWOL_CG[yCG]+mOff)%10;
  const diff=Math.round((new Date(sy,sm-1,sd)-new Date(1900,0,1))/86400000);
  const iCG=(0+diff)%10,iJJ=(10+diff)%12;
  let siCG=null,siJJ=null;
  if(hourStr&&hourStr!=='모름'){
    const hk=Object.keys(HOUR_TO_JJ).find(k=>hourStr.startsWith(k));
    if(hk){siJJ=HOUR_TO_JJ[hk];siCG=(JASI_CG[iCG]+siJJ)%10;}
  }
  const pillars=[{label:'연주',cg:yCG,jj:yJJ,isMonth:false},{label:'월주',cg:mCG,jj:mJJ,isMonth:true},{label:'일주',cg:iCG,jj:iJJ,isMonth:false}];
  if(siCG!==null)pillars.push({label:'시주',cg:siCG,jj:siJJ,isMonth:false});
  const ilgan=iCG;
  const pd=pillars.map(p=>({
    label:p.label,cg:CHEONGAN[p.cg],cg_kr:CHEONGAN_KR[p.cg],cg_oh:CG_OHAENG[p.cg],
    jj:JIJI[p.jj],jj_kr:JIJI_KR[p.jj],jj_oh:JJ_OHAENG[p.jj],
    sipseong_cg:getSipseong(ilgan,p.cg,false),sipseong_jj:getSipseong(ilgan,p.jj,true),
    woonsung:get12Woonsung(p.cg,p.jj),jijanggan:JIJANGGAN[JIJI[p.jj]]||[],
  }));
  const oh={목:0,화:0,토:0,금:0,수:0};
  for(const p of pillars){
    if(p.cg!==null)oh[CG_OHAENG[p.cg]]+=1;
    if(p.jj!==null){oh[JJ_OHAENG[p.jj]]+=1;for(const{cg}of(JIJANGGAN[JIJI[p.jj]]||[])){const ci=CHEONGAN.indexOf(cg);if(ci>=0)oh[CG_OHAENG[ci]]+=0.3;}}
  }
  const ilOh=CG_OHAENG[ilgan],genMe={목:'수',화:'목',토:'화',금:'토',수:'금'}[ilOh];
  let sup=0,opp=0;
  for(const p of pillars){const w=p.isMonth?1.5:1;
    if(p.cg!==null){const o=CG_OHAENG[p.cg];(o===ilOh||o===genMe)?sup+=w:opp+=w;}
    if(p.jj!==null){const o=JJ_OHAENG[p.jj];(o===ilOh||o===genMe)?sup+=w*1.2:opp+=w*1.2;}
  }
  const r=sup/(sup+opp);
  const shingang=r>=0.55?{result:'신강',ratio:Math.round(r*100)}:r<=0.45?{result:'신약',ratio:Math.round(r*100)}:{result:'중화',ratio:Math.round(r*100)};
  const sikMap={목:'화',화:'토',토:'금',금:'수',수:'목'};
  const yongshin=shingang.result==='신강'?{primary:sikMap[ilOh],reason:`신강 — ${sikMap[ilOh]}(식상)이 용신`}:shingang.result==='신약'?{primary:genMe,reason:`신약 — ${genMe}(인성)이 용신`}:{primary:'균형',reason:'중화 사주'};
  return{
    solarDate:{year:sy,month:sm,day:sd},originalDate:{year,month,day,isLunar,isYundal},
    gender,hourStr,pillars:pd,ilgan:{char:CHEONGAN[ilgan],kr:CHEONGAN_KR[ilgan],oh:ilOh},
    ohaengCount:oh,shingang,yongshin,
    gongmang:getGongmang(yCG,yJJ),
    relations:checkRelations(pillars.map(p=>p.jj)),
    animal:ANIMAL_EMOJI[yJJ]+ANIMALS[yJJ],
  };
}

function buildPrompt(data,name){
  const p=data.pillars;
  const pStr=p.map(pl=>`${pl.label}: ${pl.cg}${pl.jj}(${pl.cg_kr}${pl.jj_kr}) 십성:${pl.sipseong_cg}/${pl.sipseong_jj} 운성:${pl.woonsung}`).join('\n');
  const oh=data.ohaengCount;
  const oStr=Object.keys(oh).map(k=>k+':'+oh[k].toFixed(1)).join(' ');
  const rel=[...data.relations.hap,...data.relations.chung,...data.relations.pa].join(', ')||'없음';
  const sd=data.solarDate,od=data.originalDate;
  const dStr=od.isLunar?`음력${od.year}.${od.month}.${od.day}→양력${sd.year}.${sd.month}.${sd.day}`:`양력${sd.year}.${sd.month}.${sd.day}`;
  return `당신은 조선시대 주막의 주모입니다. 아래 명리학 계산 결과를 근거로 사주 해설을 해주세요.

[계산 데이터]
이름: ${name} / 성별: ${data.gender} / ${dStr} / 태어난시: ${data.hourStr} / 띠: ${data.animal}
[사주 원국]
${pStr}
[오행 분포] ${oStr}
[신강신약] ${data.shingang.result} ${data.shingang.ratio}%
[용신] ${data.yongshin.primary} — ${data.yongshin.reason}
[공망] ${data.gongmang.join(', ')}
[합충파] ${rel}

[중요 규칙 — 반드시 준수]
1. 말투: ~수다, ~이수, 어이구, 에그머니나, ~란 말이수 등 주모 사투리 필수. ${name}님 이름 자주 부르기. 막걸리·주막·장터 비유 자연스럽게.
0. 형식 규칙: 섹션 제목은 반드시 이모지+제목만 (예: 🌟 총평). ## 같은 마크다운 기호 절대 사용 금지. 본문에 🔷🔶◆◇■□▶▷ 같은 특수 도형 이모지 사용 금지. 오직 섹션 시작 이모지(🌟💪🎯💕💰🌿🍶)만 사용.
2. 한자 금지: 壬子, 甲木, 癸水 같은 한자 표현 절대 사용 금지. 반드시 한글로만 표현. (예: "임자 일주" → "임수 물기운 일주", "갑목" → "갑 나무기운")
3. 수치 금지: "토 2.5", "수 3.1" 같은 숫자 수치 절대 언급 금지. 대신 "흙 기운이 넘치수다", "물 기운이 풍부하수다" 등 자연스럽게 풀어서 표현.
4. 데이터 근거: 반드시 오행·신강약·일주 특성 등 계산 근거 명시. 감성적 추정 금지.

[해설 구조]
아래 7개 섹션을 순서대로 작성. 각 섹션은 반드시 이모지+제목으로 시작하고, 본문은 5~6문장, 각 섹션 550자 내외로 작성:

🌟 총평
💪 일주 분석 (${p[2]?p[2].cg_kr+p[2].jj_kr+' 일주':'일주'})
🎯 오행과 용신
💕 인연운
💰 재물·직업운
🌿 건강·주의사항
🍶 주모의 한마디`;
}

function callAnthropic(apiKey,prompt){
  return new Promise((resolve,reject)=>{
    const body=JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:3000,messages:[{role:'user',content:prompt}]});
    const req=https.request({hostname:'api.anthropic.com',path:'/v1/messages',method:'POST',
      headers:{'Content-Type':'application/json; charset=utf-8','x-api-key':apiKey,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)}
    },res=>{
      let d='';res.on('data',c=>d+=c);
      res.on('end',()=>{try{resolve(JSON.parse(d));}catch(e){reject(new Error('파싱오류:'+d.slice(0,200)));}});
    });
    req.on('error',reject);req.write(body);req.end();
  });
}

exports.handler=async function(event){
  const H={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Content-Type':'application/json; charset=utf-8'};
  if(event.httpMethod==='OPTIONS')return{statusCode:200,headers:H};
  if(event.httpMethod!=='POST')return{statusCode:405,body:'Method Not Allowed'};
  const apiKey=process.env.ANTHROPIC_API_KEY;
  if(!apiKey)return{statusCode:500,headers:H,body:JSON.stringify({error:'API key not configured'})};
  try{
    const input=JSON.parse(event.body);
    const sajuData=fullCalc(input);
    const prompt=buildPrompt(sajuData,input.name||'손님');
    const llm=await callAnthropic(apiKey,prompt);
    if(llm.error)throw new Error(llm.error.message||'API오류');
    return{statusCode:200,headers:H,body:JSON.stringify({saju:sajuData,reading:llm.content[0].text})};
  }catch(err){
    return{statusCode:500,headers:H,body:JSON.stringify({error:err.message})};
  }
};
