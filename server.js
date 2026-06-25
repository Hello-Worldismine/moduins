const express = require('express');
const path = require('path');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'mrpass88';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 신청서 제출
app.post('/api/submit', async (req, res) => {
  const { name, phone, birthdate, region } = req.body;

  if (!name || !phone || !birthdate || !region) {
    return res.status(400).json({ error: '모든 항목을 입력해주세요.' });
  }

  const phoneRegex = /^01[0-9]-?\d{3,4}-?\d{4}$/;
  if (!phoneRegex.test(phone.replace(/-/g, ''))) {
    return res.status(400).json({ error: '올바른 전화번호를 입력해주세요.' });
  }

  const { error } = await supabase
    .from('submissions')
    .insert({ name, phone, birthdate, region });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: '저장 중 오류가 발생했습니다.' });
  }

  res.json({ success: true, message: '신청이 완료되었습니다.' });
});

// 관리자: 신청 목록 조회
app.get('/api/submissions', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return res.status(500).json({ error: '조회 중 오류가 발생했습니다.' });
  }

  // 기존 프론트와 호환되도록 필드명 맞춰줌
  const result = data.map(d => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    birthdate: d.birthdate,
    region: d.region,
    createdAt: d.created_at
  }));

  res.json(result);
});

// 관리자: 신청 삭제
app.delete('/api/submissions/:id', async (req, res) => {
  const { password } = req.query;
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: '비밀번호가 올바르지 않습니다.' });
  }

  const { error } = await supabase
    .from('submissions')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    console.error(error);
    return res.status(500).json({ error: '삭제 중 오류가 발생했습니다.' });
  }

  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
