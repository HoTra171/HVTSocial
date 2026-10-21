const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('🚀 Running Comprehensive End-to-End System Audit...\n');
  let failures = 0;

  const assert = (condition, message) => {
    if (condition) {
      console.log(`  ✅ ${message}`);
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failures++;
    }
  };

  // 1. Auth: Login User 1
  let token1, user1;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user1@demo.com', password: 'demo123456' }),
    });
    const data = await res.json();
    token1 = data.token || data.data?.token || data.data?.accessToken;
    user1 = data.user || data.data?.user;
    assert(res.ok && token1 && user1, `Login User 1 (${user1?.full_name || 'user1'})`);
  } catch (err) {
    assert(false, `Login User 1 failed: ${err.message}`);
  }

  // 2. Auth: Login User 2
  let token2, user2;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'user2@demo.com', password: 'demo123456' }),
    });
    const data = await res.json();
    token2 = data.token || data.data?.token || data.data?.accessToken;
    user2 = data.user || data.data?.user;
    assert(res.ok && token2 && user2, `Login User 2 (${user2?.full_name || 'user2'})`);
  } catch (err) {
    assert(false, `Login User 2 failed: ${err.message}`);
  }

  const headers1 = { Authorization: `Bearer ${token1}`, 'Content-Type': 'application/json' };
  const headers2 = { Authorization: `Bearer ${token2}`, 'Content-Type': 'application/json' };

  // 3. Newsfeed & Posts
  let testPostId = null;
  try {
    const res = await fetch(`${BASE_URL}/posts?limit=10`, { headers: headers1 });
    const data = await res.json();
    const posts = Array.isArray(data) ? data : data.posts || [];
    assert(res.ok && posts.length > 0, `Feed retrieval returned ${posts.length} posts`);
    testPostId = posts[0]?.id;
  } catch (err) {
    assert(false, `Feed retrieval failed: ${err.message}`);
  }

  // 4. Comment Creation via Frontend Endpoint: POST /api/comments/post/:postId
  let createdCommentId = null;
  if (testPostId) {
    try {
      const res = await fetch(`${BASE_URL}/comments/post/${testPostId}`, {
        method: 'POST',
        headers: headers1,
        body: JSON.stringify({ content: `Kiểm tra bình luận tự động ${Date.now()}` }),
      });
      const data = await res.json();
      createdCommentId = data.comment?.id || data.data?.id;
      assert(res.status === 201 && data.success, `POST /api/comments/post/${testPostId} created comment #${createdCommentId}`);
    } catch (err) {
      assert(false, `POST /api/comments/post/:postId failed: ${err.message}`);
    }

    // 5. Get Comments on Post
    try {
      const res = await fetch(`${BASE_URL}/comments/post/${testPostId}`, { headers: headers1 });
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.comments || [];
      assert(res.ok && list.length > 0, `GET /api/comments/post/${testPostId} returned ${list.length} comments`);
    } catch (err) {
      assert(false, `GET /api/comments/post/:postId failed: ${err.message}`);
    }
  }

  // 6. Like Post
  if (testPostId) {
    try {
      const res = await fetch(`${BASE_URL}/likes/post/${testPostId}`, {
        method: 'POST',
        headers: headers1,
      });
      const data = await res.json();
      assert(res.ok, `Like/Unlike toggle on post ${testPostId} returned status ${res.status}`);
    } catch (err) {
      assert(false, `Like toggle failed: ${err.message}`);
    }
  }

  // 7. Friendship & Connections Hub Endpoints
  try {
    const [friendsRes, pendingRes, sentRes, suggestRes] = await Promise.all([
      fetch(`${BASE_URL}/friendships/friends`, { headers: headers1 }),
      fetch(`${BASE_URL}/friendships/pending`, { headers: headers1 }),
      fetch(`${BASE_URL}/friendships/sent`, { headers: headers1 }),
      fetch(`${BASE_URL}/friendships/suggestions?limit=10`, { headers: headers1 }),
    ]);

    const friendsData = await friendsRes.json();
    const pendingData = await pendingRes.json();
    const sentData = await sentRes.json();
    const suggestData = await suggestRes.json();

    assert(friendsRes.ok, `GET /friendships/friends (Count: ${(friendsData.data || []).length})`);
    assert(pendingRes.ok, `GET /friendships/pending (Count: ${(pendingData.data || []).length})`);
    assert(sentRes.ok, `GET /friendships/sent (Count: ${(sentData.data || []).length})`);
    assert(suggestRes.ok, `GET /friendships/suggestions (Count: ${(suggestData.data || []).length})`);
  } catch (err) {
    assert(false, `Friendship endpoints failed: ${err.message}`);
  }

  // 8. Notifications Hub Endpoints
  try {
    const listRes = await fetch(`${BASE_URL}/notifications`, { headers: headers1 });
    const listData = await listRes.json();
    const notifs = listData.data || listData.notifications || listData || [];
    assert(listRes.ok, `GET /notifications returned ${Array.isArray(notifs) ? notifs.length : 0} notifications`);

    const readRes = await fetch(`${BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: headers1,
    });
    assert(readRes.ok, `PUT /notifications/read-all returned status ${readRes.status}`);
  } catch (err) {
    assert(false, `Notifications endpoints failed: ${err.message}`);
  }

  // 9. Discover & Search
  try {
    const discoverRes = await fetch(`${BASE_URL}/users/discover?search=user`, { headers: headers1 });
    const discoverData = await discoverRes.json();
    assert(discoverRes.ok, `GET /users/discover returned ${(discoverData.data || []).length} users`);

    const postSearchRes = await fetch(`${BASE_URL}/posts/search?q=HVTSocial`, { headers: headers1 });
    const postSearchData = await postSearchRes.json();
    assert(postSearchRes.ok, `GET /posts/search returned ${(postSearchData.posts || []).length} posts`);
  } catch (err) {
    assert(false, `Discover / Search endpoints failed: ${err.message}`);
  }

  // 10. Direct Messaging / Chat
  if (user2?.id) {
    try {
      const dmRes = await fetch(`${BASE_URL}/chat/dm`, {
        method: 'POST',
        headers: headers1,
        body: JSON.stringify({ receiverId: user2.id }),
      });
      const dmData = await dmRes.json();
      const chatId = dmData.chatId;
      assert(dmRes.ok && chatId, `POST /chat/dm initialized DM chat #${chatId}`);

      if (chatId) {
        const msgRes = await fetch(`${BASE_URL}/chat/${chatId}/messages`, {
          method: 'POST',
          headers: headers1,
          body: JSON.stringify({ content: `Tin nhắn tự động ${Date.now()}` }),
        });
        assert(msgRes.ok, `POST /chat/${chatId}/messages sent message successfully`);
      }
    } catch (err) {
      assert(false, `Chat DM endpoints failed: ${err.message}`);
    }
  }

  console.log('\n=============================================');
  if (failures === 0) {
    console.log('🏆 ALL 10 COMPREHENSIVE SYSTEM TESTS PASSED 100%!');
    console.log('=============================================\n');
    process.exit(0);
  } else {
    console.error(`🚨 ${failures} test(s) failed.`);
    console.log('=============================================\n');
    process.exit(1);
  }
}

testAll();
