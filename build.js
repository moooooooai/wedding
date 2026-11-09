// index.html의 {{키}}를 예식 정보로 채워 dist/index.html을 만듭니다.
// 정보 출처: 환경변수 WEDDING_INFO(JSON) → info.json → info.example.json 순서
const fs = require('fs');

const raw = process.env.WEDDING_INFO
  || (fs.existsSync('info.json') && fs.readFileSync('info.json', 'utf8'))
  || fs.readFileSync('info.example.json', 'utf8');
const info = JSON.parse(raw);

const esc = s => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const js = v => JSON.stringify(v).replace(/</g, '\\u003c');

const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(info.date);
if (!m) throw new Error('date는 "YYYY-MM-DDTHH:MM" 형식이어야 합니다: ' + info.date);
const [, Y, M, D, h, min] = m.map(Number);
const weekday = '일월화수목금토'[new Date(Y, M - 1, D).getDay()];
const time = `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}시${min ? ` ${min}분` : ''}`;

const accounts = list => (list || []).map(a => {
  const num = `${a.bank} ${a.number}`;
  return `<div class="acct"><div>${esc(num)}<small>${esc(a.holder)}</small></div>` +
    `<button class="btn" data-copy="${esc(num)}">복사</button></div>`;
}).join('\n      ');

const values = {
  ...Object.fromEntries(Object.entries(info).map(([k, v]) => [k, esc(v)])),
  date_text: esc(`${Y}년 ${M}월 ${D}일 ${weekday}요일 ${time}`),
  date_big: `${Y}<br>${String(M).padStart(2, '0')} · ${String(D).padStart(2, '0')}`,
  date_js: js(info.date),
  venue_js: js(info.venue),
  accounts_groom: accounts(info.accounts_groom),
  accounts_bride: accounts(info.accounts_bride),
};

const html = fs.readFileSync('index.html', 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => {
  if (!(k in values)) throw new Error('info에 없는 키: ' + k);
  return values[k];
});

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync('dist/index.html', html);
console.log('dist/index.html 생성 완료');
