# 주모여기사주요 (배포용 v3)

## 구성
- `public/index.html` : 프론트(단일 파일)
- `netlify/functions/saju.js` : 만세력 계산 + 해설 생성(LLM/API 호출 없음)
- `netlify.toml` : `/api/* -> /.netlify/functions/*` 프록시
- `package.json` : `lunar-javascript` 의존성

## Netlify 배포 (가장 쉬움)
1) 이 폴더를 그대로 Netlify에 업로드 (Git 연동 or Drag&Drop)
2) Build command: `npm install` (또는 비워도 Netlify가 자동 설치)
3) Publish directory: `public`
4) Functions directory: `netlify/functions`

## 로컬 테스트
```bash
cd jomo-saju
npm i
npm i -g netlify-cli
netlify dev
```
브라우저에서 표시된 로컬 주소로 접속하면 `/api/saju`가 정상 동작합니다.

> ⚠️ `public/index.html` 파일을 로컬에서 그냥 더블클릭으로 열면
> `/api/saju`가 없어서 버튼이 동작하지 않습니다. 반드시 `netlify dev`(또는 동일한 서버 프록시)로 실행해야 합니다.
