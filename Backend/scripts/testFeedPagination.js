const API_URL = 'http://localhost:5000/api';

async function testPagination() {
    try {
        // 1. Login to get token
        // Note: Use a valid user from your DB
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'lethiminhnhat@example.com', // Replace with a user that likely exists or was migrated
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();

        if (!loginRes.ok) {
            console.log('Login failed:', loginData);
            // Fallback: If login fails, we can't test properly unless we have a token.
            // Assuming we might have a user 'admin' or similar if migration ran.
            // Try 'nguyenvana@gmail.com' / '123456' from seed if exists.
            return;
        }

        // Check if response has token (standardized response might wrap it)
        const token = loginData.data?.accessToken || loginData.token || loginData.accessToken;
        console.log('Logged in, token:', token ? 'YES' : 'NO');

        if (!token) return;

        // 2. Fetch page 1 (cursor null)
        console.log('Fetching Feed (Page 1)...');
        const res1 = await fetch(`${API_URL}/posts?limit=2`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data1 = await res1.json();
        console.log('res1:', data1);

        const posts1 = data1.posts || (Array.isArray(data1) ? data1 : []);
        const nextCursor = data1.nextCursor;

        console.log(`Page 1: Got ${posts1.length} posts. Next Cursor: ${nextCursor}`);

        // 3. Fetch page 2 (using cursor)
        if (nextCursor) {
            console.log('Fetching Feed (Page 2)...');
            const res2 = await fetch(`${API_URL}/posts?limit=2&cursor=${encodeURIComponent(nextCursor)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data2 = await res2.json();
            const posts2 = data2.posts || [];
            console.log(`Page 2: Got ${posts2.length} posts.`);
        }

    } catch (err) {
        console.error('Test error:', err);
    }
}

testPagination();
