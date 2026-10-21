// scripts/testAuthErrors.js
const BASE_URL = 'http://localhost:5000/api';

async function testAuthValidation() {
  console.log('🧪 Bắt đầu kiểm tra thông báo lỗi Đăng ký & Đăng nhập...\n');
  let passCount = 0;
  let testCount = 0;

  const testCase = async (name, url, body, expectedMsgSubstring, expectedStatus = 400) => {
    testCount++;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      const message = data.message || data.errors?.[0]?.message || '';

      const match = res.status === expectedStatus && message.toLowerCase().includes(expectedMsgSubstring.toLowerCase());
      if (match) {
        console.log(`  ✅ [PASS] ${name}`);
        console.log(`     👉 Phản hồi: "${message}" (Status: ${res.status})`);
        passCount++;
      } else {
        console.log(`  ❌ [FAIL] ${name}`);
        console.log(`     👉 Kỳ vọng: status ${expectedStatus}, chứa "${expectedMsgSubstring}"`);
        console.log(`     👉 Thực tế: status ${res.status}, message: "${message}"`);
      }
    } catch (err) {
      console.log(`  ❌ [ERROR] ${name}: ${err.message}`);
    }
  };

  // 1. Password ngắn (< 8 ký tự)
  await testCase(
    'Mật khẩu quá ngắn (< 8 ký tự)',
    `${BASE_URL}/auth/register`,
    {
      full_name: 'Nguyễn Văn Test',
      username: 'testpass1',
      email: 'testpass1@example.com',
      password: '123'
    },
    'Mật khẩu phải có ít nhất 8 ký tự'
  );

  // 2. Password thiếu chữ hoa hoặc số
  await testCase(
    'Mật khẩu không đủ độ phức tạp (thiếu chữ hoa, số)',
    `${BASE_URL}/auth/register`,
    {
      full_name: 'Nguyễn Văn Test',
      username: 'testpass2',
      email: 'testpass2@example.com',
      password: 'passworddai'
    },
    'chữ hoa, 1 chữ thường và 1 chữ số'
  );

  // 3. Username có ký tự đặc biệt hoặc dấu cách
  await testCase(
    'Username chứa khoảng trắng hoặc ký tự đặc biệt',
    `${BASE_URL}/auth/register`,
    {
      full_name: 'Nguyễn Văn Test',
      username: 'user name!',
      email: 'testuser3@example.com',
      password: 'Password123'
    },
    'chỉ được chứa chữ cái và số'
  );

  // 4. Email không đúng định dạng
  await testCase(
    'Email không đúng định dạng',
    `${BASE_URL}/auth/register`,
    {
      full_name: 'Nguyễn Văn Test',
      username: 'testemail4',
      email: 'email-sai-dinh-dang',
      password: 'Password123'
    },
    'Email không đúng định dạng'
  );

  // 5. Trùng email đã tồn tại
  await testCase(
    'Đăng ký với email đã tồn tại',
    `${BASE_URL}/auth/register`,
    {
      full_name: 'Người Trùng Email',
      username: 'newuser999',
      email: 'user1@demo.com',
      password: 'Password123'
    },
    'Email này đã được sử dụng'
  );

  // 6. Đăng ký thành công tài khoản mới hợp lệ
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  await testCase(
    'Đăng ký tài khoản mới hợp lệ đầy đủ',
    `${BASE_URL}/auth/register`,
    {
      full_name: 'Người Dùng Thử Nghiệm',
      username: `tester${randomSuffix}`,
      email: `tester${randomSuffix}@testdomain.com`,
      password: 'SecurePassword123',
      gender: 'male',
      date_of_birth: '2000-01-01'
    },
    'thành công',
    201
  );

  // 7. Đăng nhập sai mật khẩu
  await testCase(
    'Đăng nhập sai mật khẩu',
    `${BASE_URL}/auth/login`,
    {
      email: 'user1@demo.com',
      password: 'wrong_password_123'
    },
    'Email hoặc mật khẩu không đúng',
    401
  );

  // 8. Đăng nhập thành công
  await testCase(
    'Đăng nhập đúng mật khẩu',
    `${BASE_URL}/auth/login`,
    {
      email: 'user1@demo.com',
      password: 'demo123456'
    },
    'thành công',
    200
  );

  console.log(`\n📊 KẾT QUẢ: ${passCount}/${testCount} bài test vượt qua thành công!`);
  process.exit(passCount === testCount ? 0 : 1);
}

testAuthValidation();
