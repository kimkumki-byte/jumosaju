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

// 입춘 날짜 (월,일) - 연주/월주 기준점
const IPCHUN = {
  1900:[2,5],1901:[2,4],1902:[2,5],1903:[2,5],1904:[2,5],1905:[2,4],
  1906:[2,5],1907:[2,5],1908:[2,5],1909:[2,4],1910:[2,5],1911:[2,5],
  1912:[2,5],1913:[2,4],1914:[2,5],1915:[2,5],1916:[2,5],1917:[2,4],
  1918:[2,5],1919:[2,5],1920:[2,5],1921:[2,4],1922:[2,5],1923:[2,5],
  1924:[2,5],1925:[2,4],1926:[2,5],1927:[2,5],1928:[2,5],1929:[2,4],
  1930:[2,5],1931:[2,5],1932:[2,5],1933:[2,4],1934:[2,5],1935:[2,5],
  1936:[2,5],1937:[2,4],1938:[2,5],1939:[2,5],1940:[2,5],1941:[2,4],
  1942:[2,5],1943:[2,5],1944:[2,5],1945:[2,4],1946:[2,5],1947:[2,5],
  1948:[2,5],1949:[2,4],1950:[2,5],1951:[2,5],1952:[2,5],1953:[2,4],
  1954:[2,4],1955:[2,4],1956:[2,5],1957:[2,4],1958:[2,4],1959:[2,4],
  1960:[2,5],1961:[2,4],1962:[2,4],1963:[2,4],1964:[2,5],1965:[2,4],
  1966:[2,4],1967:[2,4],1968:[2,5],1969:[2,4],1970:[2,4],1971:[2,4],
  1972:[2,5],1973:[2,4],1974:[2,4],1975:[2,4],1976:[2,5],1977:[2,4],
  1978:[2,4],1979:[2,4],1980:[2,5],1981:[2,4],1982:[2,4],1983:[2,4],
  1984:[2,5],1985:[2,4],1986:[2,4],1987:[2,4],1988:[2,4],1989:[2,4],
  1990:[2,4],1991:[2,4],1992:[2,4],1993:[2,4],1994:[2,4],1995:[2,4],
  1996:[2,4],1997:[2,4],1998:[2,4],1999:[2,4],2000:[2,4],2001:[2,4],
  2002:[2,4],2003:[2,4],2004:[2,4],2005:[2,4],2006:[2,4],2007:[2,4],
  2008:[2,4],2009:[2,4],2010:[2,4],2011:[2,4],2012:[2,4],2013:[2,4],
  2014:[2,4],2015:[2,4],2016:[2,4],2017:[2,3],2018:[2,4],2019:[2,4],
  2020:[2,4],2021:[2,3],2022:[2,4],2023:[2,4],2024:[2,4],2025:[2,3],
  2026:[2,4],2027:[2,4],2028:[2,4],2029:[2,3],2030:[2,4],
};

// 입춘 이전 여부 체크
function isBeforeIpchun(year, month, day) {
  const ic = IPCHUN[year];
  if (!ic) return false;
  if (month < ic[0]) return true;
  if (month === ic[0] && day < ic[1]) return true;
  return false;
}

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
  // 입춘 기준으로 명리학적 연도 결정
  const myYear = isBeforeIpchun(sy, sm, sd) ? sy - 1 : sy;
  const yCG=((myYear-4)%10+10)%10,yJJ=((myYear-4)%12+12)%12;
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

function buildPrompt(data,name,title){
  const p=data.pillars;
  const pStr=p.filter(Boolean).map(pl=>`${pl.label}: ${pl.cg_kr}${pl.jj_kr}(${pl.sipseong_cg}/${pl.sipseong_jj})`).join(' | ');
  const oh=data.ohaengCount;
  const ohStr=Object.keys(oh).map(k=>k+':'+oh[k].toFixed(1)).join(' ');
  const rel=[...data.relations.hap,...data.relations.chung,...data.relations.pa].join(', ')||'없음';
  const sd=data.solarDate,od=data.originalDate;
  const dStr=od.isLunar?`음력${od.year}.${od.month}.${od.day}→양력${sd.year}.${sd.month}.${sd.day}`:`양력${sd.year}.${sd.month}.${sd.day}`;
  const overOh=Object.keys(oh).sort((a,b)=>oh[b]-oh[a])[0];
  const lackOh=Object.keys(oh).sort((a,b)=>oh[a]-oh[b])[0];
  const ilju=p[2]?p[2].cg_kr+p[2].jj_kr:'미상';
  const halRatio=Math.round(data.shingang.ratio/10)+'할';
  return `조선 주막 주모. 사주 해설 작성.

[데이터] ${name} ${title} / ${dStr} / ${data.animal} / ${data.hourStr}
${pStr}
오행:${ohStr} | ${data.shingang.result}(${halRatio}) | 용신:${data.yongshin.primary} | 공망:${data.gongmang.join(',')} | 합충파:${rel} | 과다:${overOh} 부족:${lackOh}

[절대 금지]
- 영어 단어 완전 금지. 퍼센트→할, 에너지→기운, 패턴→사례, 밸런스→균형
- 사주 전문용어 금지. 쉬운 말로: 편관→고집/카리스마, 편인→직관/아이디어, 비견→자존심/경쟁심, 신강→기운 넘침
- 마크다운 금지. 따옴표(" ' ) 완전 금지. 숫자 수치 금지.

[말투] 충청도 주막 주모.
- 문장끝: ~유/~겠슈/~구먼유/~이랑께유/~다 그려/~그렇구먼유
- 합니다/요/어요 절대 금지
- 이름: ${name} ${title} 로만
- 주막·장터·막걸리·논밭 비유

[톤] 따뜻하고 솔직한 주모. 칭찬은 칭찬하고, 조언은 부드럽게. 팩트폭행은 딱 한 곳만, 위트 있게.

[형식] 이모지+제목 / 핵심한줄(임팩트, !나 ~로 끝) / 본문 3문장(쉽고 재미있게)
모든 섹션 핵심한줄 필수. 마지막 문장 반드시 완전히 끝낼 것.

🌟 총평
💪 일주 분석 (${ilju} 일주)
🎯 오행과 용신
💕 인연운
💰 재물·직업운
🌿 건강·주의사항
🍶 주모의 한마디`;
}


function callAnthropic(apiKey,prompt){
  return new Promise((resolve,reject)=>{
    const body=JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:2200,messages:[{role:'user',content:prompt}]});
    const req=https.request({hostname:'api.anthropic.com',path:'/v1/messages',method:'POST',
      headers:{'Content-Type':'application/json; charset=utf-8','x-api-key':apiKey,'anthropic-version':'2023-06-01','Content-Length':Buffer.byteLength(body)}
    },res=>{
      let d='';res.on('data',c=>d+=c);
      res.on('end',()=>{
      try{
        const parsed=JSON.parse(d);
        if(parsed.error){reject(new Error('Anthropic: '+(parsed.error.message||JSON.stringify(parsed.error))));}
        else{resolve(parsed);}
      }catch(e){reject(new Error('Anthropic응답오류: '+d.slice(0,300)));}
    });
    });
    req.on('error',reject);req.write(body);req.end();
  });
}

module.exports=async function(req,res){
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  if(req.method==='OPTIONS'){res.statusCode=200;res.end();return;}
  if(req.method!=='POST'){res.statusCode=405;res.end('Method Not Allowed');return;}
  const apiKey=process.env.ANTHROPIC_API_KEY;
  if(!apiKey){res.statusCode=500;res.end(JSON.stringify({error:'API key not configured'}));return;}
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body):req.body;
    const sajuData=fullCalc(body);
    const title=body.gender==='남'?'도령':'아씨';
    const prompt=buildPrompt(sajuData,body.name||'손님',title);
    const llm=await callAnthropic(apiKey,prompt);
    if(llm.error)throw new Error(llm.error.message||'API오류');
    res.statusCode=200;res.end(JSON.stringify({saju:sajuData,reading:llm.content[0].text}));
  }catch(err){
    res.statusCode=500;res.end(JSON.stringify({error:err.message}));
  }
};
