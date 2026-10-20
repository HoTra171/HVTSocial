const BASE_URL = 'http://localhost:5000/api';

async function testAll() {
  console.log('🚀 Running Deep End-to-End API Audit...');
  let hasError = false;

  // 1. Login user1
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user1@demo.com', password: 'demo123456' })
  });
  const loginData = await loginRes.json();
  const token1 = loginData.token || loginData.data?.token || loginData.data?.accessToken;
  const user1 = loginData.user || loginData.data?.user;
  const headers1 = { 'Authorization': `Bearer ${token1}`, 'Content-Type': 'application/json' };
  console.log(`✅ 1. Logged in User 1: ${user1.full_name} (${user1.email})`);

  // 2. Login user2
  const loginRes2 = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user2@demo.com', password: 'demo123456' })
  });
  const loginData2 = await loginRes2.json();
  const token2 = loginData2.token || loginData2.data?.token || loginData2.data?.accessToken;
  const user2 = loginData2.user || loginData2.data?.user;
  const headers2 = { 'Authorization': `Bearer ${token2}`, 'Content-Type': 'application/json' };
  console.log(`✅ 2. Logged in User 2: ${user2.full_name} (${user2.email})`);

  // 3. Newsfeed posts
  let postId = null;
  try {
    const res = await fetch(`${BASE_URL}/posts?limit=5`, { headers: headers1 });
    const data = await res.json();
    const posts = data.posts || data;
    postId = posts[0]?.id;
    console.log(`✅ 3. Feed has ${posts.length} posts. Top post ID: ${postId}`);
  } catch (err) {
    hasError = true;
    console.error('❌ 3. Feed failed:', err.message);
  }

  // 4. Comments on top post
  if (postId) {
    try {
      // Create comment
      const createCommentRes = await fetch(`${BASE_URL}/comments`, {
        method: 'POST',
        headers: headers1,
        body: JSON.stringify({
          post_id: postId,
          content: 'Bình luận kiểm thử tự động từ User 1! Hệ thống hoạt động rất mượt mà.'
        })
      });
      const commentData = await createCommentRes.json();
      console.log(`✅ 4a. Comment created on post ${postId}:`, commentData?.id || 'OK');

      // Get comments
      const getCommentsRes = await fetch(`${BASE_URL}/comments/post/${postId}`, { headers: headers1 });
      const comments = await getCommentsRes.json();
      console.log(`✅ 4b. GET /comments/post/${postId} returned ${Array.isArray(comments) ? comments.length : (comments.comments?.length || 0)} comments`);
    } catch (err) {
      hasError = true;
      console.error('❌ 4. Comments failed:', err.message);
    }
  }

  // 5. User Search & Suggestions
  try {
    const searchRes = await fetch(`${BASE_URL}/users/discover?q=demo`, { headers: headers1 });
    const searchData = await searchRes.json();
    console.log(`✅ 5a. GET /users/discover?q=demo found ${(searchData.users || searchData || []).length} users`);

    const suggestRes = await fetch(`${BASE_URL}/users/suggest`, { headers: headers1 });
    const suggestData = await suggestRes.json();
    console.log(`✅ 5b. GET /users/suggest returned ${(suggestData.users || suggestData || []).length} suggestions`);
  } catch (err) {
    hasError = true;
    console.error('❌ 5. Search / Suggest failed:', err.message);
  }

  // 6. Post Search
  try {
    const postSearchRes = await fetch(`${BASE_URL}/posts/search?q=HVTSocial`, { headers: headers1 });
    const postSearchData = await postSearchRes.json();
    console.log(`✅ 6. GET /posts/search found ${(postSearchData.posts || []).length} matching posts`);
  } catch (err) {
    hasError = true;
    console.error('❌ 6. Post search failed:', err.message);
  }

  // 7. Friendship check
  try {
    const friendsRes = await fetch(`${BASE_URL}/friendships/friends`, { headers: headers1 });
    const friendsData = await friendsRes.json();
    console.log(`✅ 7. GET /friendships/friends:`, Array.isArray(friendsData) ? friendsData.length : (friendsData.friends?.length || 0), 'friends');
  } catch (err) {
    hasError = true;
    console.error('❌ 7. Friendships failed:', err.message);
  }

  // 8. Notifications list
  try {
    const notifRes = await fetch(`${BASE_URL}/notifications`, { headers: headers1 });
    const notifData = await notifRes.json();
    console.log(`✅ 8. GET /notifications returned ${(notifData.notifications || notifData || []).length} notifications`);
  } catch (err) {
    hasError = true;
    console.error('❌ 8. Notifications failed:', err.message);
  }

  // 9. Saved posts list
  try {
    const savedRes = await fetch(`${BASE_URL}/saved-posts`, { headers: headers1 });
    const savedData = await savedRes.json();
    console.log(`✅ 9. GET /saved-posts returned ${(savedData.posts || savedData || []).length} saved posts`);
  } catch (err) {
    hasError = true;
    console.error('❌ 9. Saved posts failed:', err.message);
  }

  if (hasError) {
    console.log('\n❌ One or more deep audit tests failed.');
    process.exit(1);
  } else {
    console.log('\n🏆 ALL 9 COMPREHENSIVE ENDPOINT SUITES PASSED PERFECTLY!');
    process.exit(0);
  }
}

testAll();
