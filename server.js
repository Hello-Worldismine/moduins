const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

// JSON 파일 인코딩 명시
const FILE_ENCODING = 'utf8';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mrpass88';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readSubmissions() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]), FILE_ENCODING);
  }
  const raw = fs.readFileSync(DATA_FILE, FILE_ENCODING);
  return JSON.parse(raw);
}

function writeSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), FILE_ENCODING);
}

// 신청서 제출
app.post('/api/submit', (req, res) => {
  const { name, phone, birthdate, region } = req.body;

  if (!name || !phone || !birthdate || !region) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
  }

  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  if (!phoneRegex.test(phone.replace(/-/g, ''))) {
    return res.status(400).json({ error: '올바른 전화번호를 입력해주세요.' });
  }

  const submissions = readSubmissions();
  const newEntry = {
    id: Date.now(),
    name,
    phone,
    birthdate,
    region,
    createdAt: new Date().toISOString()
  };

  submissions.unshift(newEntry);
  writeSubmissions(submissions);

  res.json({ success: true, message: '신청이 완료되었습니다.' });
});

// 관리자: 신청 목록 조회
app.get('/api/submissions', (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  const submissions = readSubmissions();
  res.json(submissions);
});

// 관리자: 신청 삭제
app.delete('/api/submissions/:id', (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }
  const id = parseInt(req.params.id);
  let submissions = readSubmissions();
  submissions = submissions.filter(s => s.id !== id);
  writeSubmissions(submissions);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  console.log(`관리자 페이지: http://localhost:${PORT}/admin.html`);
});
