const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('=== API测试 ===\n');
  
  const phone = '1390013900' + Math.floor(Math.random() * 10);
  
  console.log(`1. 测试发送验证码 (手机号: ${phone})...`);
  const sendCodeRes = await makeRequest(
    { hostname: 'localhost', port: 3000, path: '/api/auth/send-code', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify({ phone })
  );
  console.log('发送验证码:', JSON.stringify(sendCodeRes.body, null, 2));
  
  const code = sendCodeRes.body.data?.code || '123456';
  console.log('\n2. 测试注册...');
  const registerRes = await makeRequest(
    { hostname: 'localhost', port: 3000, path: '/api/auth/register', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    JSON.stringify({ phone, code, nickname: '测试用户' + Math.floor(Math.random() * 1000) })
  );
  console.log('注册:', JSON.stringify(registerRes.body, null, 2));
  
  const token = registerRes.body.data?.token;
  if (token) {
    console.log('\n3. 测试刷新Token...');
    const refreshRes = await makeRequest(
      { hostname: 'localhost', port: 3000, path: '/api/auth/refresh', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      JSON.stringify({ refreshToken: token })
    );
    console.log('刷新Token:', JSON.stringify(refreshRes.body, null, 2));
    
    console.log('\n4. 测试获取场景列表...');
    const scenesRes = await makeRequest(
      { hostname: 'localhost', port: 3000, path: '/api/scenes', method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
    );
    console.log('场景列表:', JSON.stringify(scenesRes.body, null, 2));
  } else {
    console.log('\n注册失败，无法继续测试');
  }
  
  console.log('\n=== 测试完成 ===');
}

main().catch(console.error);