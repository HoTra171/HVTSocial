import { pool } from '../config/db.js';
import jwt from 'jsonwebtoken';

async function testComment() {
  try {
    const db = await pool;
    // Find an existing post and user
    const postRes = await db.request().query('SELECT TOP 1 id FROM posts ORDER BY id DESC');
    const userRes = await db.request().query('SELECT TOP 1 id, email, full_name, username FROM users ORDER BY id ASC');

    if (!postRes.recordset.length || !userRes.recordset.length) {
      console.log('No post or user found to test comments');
      process.exit(1);
    }

    const postId = postRes.recordset[0].id;
    const user = userRes.recordset[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username },
      process.env.JWT_SECRET || 'your-default-jwt-secret-key-change-this',
      { expiresIn: '1h' }
    );

    console.log(`Testing comment on post ${postId} by user ${user.id}...`);

    // Test POST /api/comments/post/:postId
    const createRes = await fetch(`http://localhost:5000/api/comments/post/${postId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content: 'Bình luận kiểm tra tự động ' + Date.now() }),
    });

    const createData = await createRes.json();
    console.log('POST /api/comments/post/:postId status:', createRes.status, createData);

    if (createRes.status !== 201) {
      throw new Error(`Expected 201, got ${createRes.status}`);
    }

    // Test GET /api/comments/post/:postId
    const getRes = await fetch(`http://localhost:5000/api/comments/post/${postId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const getData = await getRes.json();
    console.log('GET /api/comments/post/:postId status:', getRes.status, 'comments count:', Array.isArray(getData) ? getData.length : 0);

    console.log('✅ Comment API fix VERIFIED successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

testComment();
