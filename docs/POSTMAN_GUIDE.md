# 📮 Postman Collection Usage Guide

## 🚀 Quick Start

### 1. Import Collection

**Option A: Import from File**
1. Open Postman
2. Click **"Import"** button (top left)
3. Select **"Upload Files"**
4. Choose `docs/HVTSocial.postman_collection.json`
5. Click **"Import"**

**Option B: Import from URL** (if hosted on GitHub)
```
https://raw.githubusercontent.com/HoTra171/HVTSocial/main/docs/HVTSocial.postman_collection.json
```

---

### 2. Create Environment

Create a new environment with these variables:

| Variable | Initial Value | Current Value (auto-filled) |
|----------|---------------|----------------------------|
| `baseUrl` | `https://hvtsocial-backend.onrender.com` | - |
| `accessToken` | *(leave empty)* | Auto-saved after login |
| `refreshToken` | *(leave empty)* | Auto-saved after login |
| `currentUserId` | *(leave empty)* | Auto-saved after login |

**Steps:**
1. Click ⚙️ icon (top right) → **"Manage Environments"**
2. Click **"Add"**
3. Name: `HVTSocial - Production`
4. Add variables from table above
5. Click **"Add"**
6. Select environment from dropdown

---

### 3. Test Authentication Flow

#### Step 1: Register a New User
1. Open **Authentication** folder
2. Select **"Register"** request
3. Update body with your details:
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!",
  "full_name": "Test User",
  "username": "testuser"
}
```
4. Click **"Send"**
5. ✅ Expected: `200 OK` with user object

---

#### Step 2: Login
1. Select **"Login"** request
2. Body (use same credentials):
```json
{
  "email": "test@example.com",
  "password": "SecurePass123!"
}
```
3. Click **"Send"**
4. ✅ **Auto-magic:** `accessToken` and `refreshToken` saved to environment!

**Check saved tokens:**
- Click 👁️ icon (environment quick look)
- You should see tokens in "Current Value" column

---

#### Step 3: Test Authenticated Endpoint
1. Select **"Get Current User"** (GET `/api/auth/me`)
2. Click **"Send"**
3. ✅ Should return your user profile

**Authorization is automatic!**
The collection inherits `Bearer {{accessToken}}` for all requests.

---

### 4. Test Other Features

#### 📝 Create a Post
1. **Posts** → **"Create Post"**
2. Body:
```json
{
  "content": "Hello from Postman! 🚀",
  "media": null,
  "status": "public"
}
```
3. Send → Get `post_id` from response

---

#### ❤️ Like a Post
1. **Likes** → **"Like Post"**
2. Set `:postId` variable (e.g., `1`)
3. Send → Post liked!

---

#### 💬 Send a Message
1. **Chat** → **"Send Message"**
2. Use `form-data` (not JSON):
   - `text`: "Hello!"
   - `receiverId`: `2` (another user's ID)
   - `image`: (optional file)
3. Send

---

#### 👥 Send Friend Request
1. **Friendships** → **"Send Friend Request"**
2. Body:
```json
{
  "friendId": 2
}
```
3. Send

---

## 🔧 Advanced Usage

### Testing with Different Users

**Scenario:** Simulate 2 users chatting

1. **Register User A** (`userA@test.com`)
2. **Login as User A** → Tokens saved
3. **Create Environment Copy:**
   - Duplicate environment
   - Name: `HVTSocial - User A`
4. **Register User B** (`userB@test.com`)
5. **Login as User B** → Overrides tokens
6. **Create Environment:**
   - Name: `HVTSocial - User B`
7. **Switch environments** to test interactions!

---

### Auto-Refresh Token

If you get `401 Unauthorized`:
1. Run **"Refresh Token"** request
2. New `accessToken` auto-saved
3. Retry failed request

**Or enable auto-refresh:**
1. Collection Settings → **"Pre-request Script"** (tab)
2. Add script:
```javascript
pm.sendRequest({
  url: pm.environment.get('baseUrl') + '/api/auth/refresh',
  method: 'POST',
  header: { 'Content-Type': 'application/json' },
  body: {
    mode: 'raw',
    raw: JSON.stringify({
      refreshToken: pm.environment.get('refreshToken')
    })
  }
}, (err, res) => {
  if (!err && res.code === 200) {
    const json = res.json();
    pm.environment.set('accessToken', json.accessToken);
  }
});
```

---

## 📊 Collection Structure

```
HVTSocial API Collection
├── 🔐 Authentication (5 requests)
│   ├── Register
│   ├── Login (auto-saves tokens)
│   ├── Get Current User
│   ├── Refresh Token
│   └── Logout
├── 📝 Posts (6 requests)
│   ├── Get Feed
│   ├── Get Post by ID
│   ├── Create Post
│   ├── Update Post
│   ├── Delete Post
│   └── Search Posts
├── 👤 Users (3 requests)
│   ├── Get User Profile
│   ├── Update Profile (multipart)
│   └── Discover Users
├── ❤️ Likes (2 requests)
├── 💬 Comments (3 requests)
├── 👥 Friendships (5 requests)
├── 💬 Chat (3 requests)
├── 🔔 Notifications (3 requests)
├── 📸 Stories (3 requests)
└── 📤 Media Upload (1 request)
```

**Total: 50+ Endpoints**

---

## 🐛 Troubleshooting

### Error: "Not allowed by CORS"
**Solution:** Your backend's CORS config doesn't allow Postman
- Add `null` to `allowedOrigins` (Backend/config/cors.js)
- Or disable CORS temporarily in Postman:
  - Settings → Interceptor → ON

---

### Error: "Invalid token"
**Solution:** Token expired
1. Run **"Login"** again
2. Or use **"Refresh Token"** request

---

### Error: "Cannot read file"
**Solution:** For file uploads (avatar, media)
- Use **"form-data"** (NOT raw JSON)
- Select file type in Postman dropdown

---

### Error: 500 Server Error
**Solution:** Check backend logs
- Ensure backend is running (`npm start`)
- Check database connection
- Verify environment variables (.env)

---

## 💡 Pro Tips

### 1. Save Test Data
Create a **"Tests"** tab script to save IDs:
```javascript
// After creating a post
if (pm.response.code === 200) {
  const json = pm.response.json();
  pm.environment.set('lastPostId', json.post.id);
}
```

---

### 2. Bulk Testing
Use **"Runner"** to test multiple endpoints:
1. Collection → **"Run"**
2. Select requests to test
3. Choose environment
4. Click **"Run HVTSocial"**

---

### 3. Share Collection
Export and share with team:
1. Collection → **"..."** → **"Export"**
2. Choose **"Collection v2.1"**
3. Share JSON file

---

## 📚 Resources

- [Postman Docs](https://learning.postman.com/docs/getting-started/introduction/)
- [HVTSocial Swagger Docs](http://localhost:5000/api-docs)
- [GitHub Repository](https://github.com/HoTra171/HVTSocial)

---

**Happy Testing! 🚀**
