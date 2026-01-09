# 📚 Documentation Index

Welcome to HVTSocial's comprehensive documentation!

---

## 📖 Main Documentation

### [README.md](../README.md) 🌟
**Main project documentation** - Start here!
- Project overview & badges
- Feature showcase with screenshots
- System architecture diagram
- Tech stack breakdown
- API documentation links
- Security features (comprehensive)
- Getting started guide

---

## 🎯 Portfolio & Setup

### [PORTFOLIO_CHECKLIST.md](./PORTFOLIO_CHECKLIST.md) ✅
**Complete portfolio preparation checklist**
- Screenshot requirements
- Architecture diagram status
- API documentation checklist
- Security documentation review
- CV improvement suggestions
- Deployment checklist
- Performance metrics guide
- Interview preparation tips

**Priority:** 🔴 HIGH - Use this as your roadmap!

---

### [SCREENSHOT_GUIDE.md](./SCREENSHOT_GUIDE.md) 📸
**How to capture professional screenshots/GIFs**
- 6 essential screenshots to capture:
  1. Feed Demo
  2. Chat Interface
  3. User Profile
  4. Notifications
  5. Create Post
  6. Comments Section
- Recommended tools (ScreenToGif, Kap)
- Best practices for resolution & optimization
- Naming conventions

**Action Required:** Follow this guide to create all demo media!

---

## 🔌 API Documentation

### [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) 📮
**Postman Collection usage guide**
- How to import collection
- Environment setup
- Authentication flow walkthrough
- Testing different features
- Troubleshooting common issues
- Advanced tips (bulk testing, auto-refresh)

**Companion File:** [HVTSocial.postman_collection.json](./HVTSocial.postman_collection.json)

---

### [HVTSocial.postman_collection.json](./HVTSocial.postman_collection.json) 📦
**50+ API endpoints ready to import**
- Authentication (Register, Login, Token Refresh)
- Posts (CRUD, Feed, Search)
- Users (Profile, Discovery)
- Likes & Comments
- Friendships (Friend Requests)
- Chat (Messaging)
- Notifications
- Stories (24h content)
- Media Upload

**Features:**
- Auto-saves JWT tokens after login
- Environment variables for easy switching
- Pre-configured requests with examples

---

### [SOCKET_EVENTS.md](./SOCKET_EVENTS.md) 🔌
**Complete Socket.IO events reference**
- Connection & Registration
- Chat Events (send, receive, typing, read receipts)
- Notification Events (push, unread counts)
- User Status (online/offline)
- Video Call Events (WebRTC signaling)
- Story Events
- Friend Request Events
- Post Interaction Events
- Error handling & reconnection
- Implementation examples with Mermaid diagrams

---

## 📁 File Structure

```
docs/
├── README_DOCS.md              ← You are here!
├── PORTFOLIO_CHECKLIST.md      ← 📋 Start with this
├── SCREENSHOT_GUIDE.md         ← 📸 Capture demos
├── POSTMAN_GUIDE.md            ← 📮 API testing
├── SOCKET_EVENTS.md            ← 🔌 Real-time events
├── HVTSocial.postman_collection.json  ← 📦 Import this
└── assets/                     ← 🖼️ Screenshots go here
    ├── feed_demo.png/gif
    ├── chat_demo.png/gif
    ├── profile_demo.png
    ├── notification_demo.png/gif
    ├── post_demo.png/gif
    └── comment_demo.png
```

---

## 🎯 Quick Start for Portfolio Preparation

### Step 1: Review Checklist
Read [PORTFOLIO_CHECKLIST.md](./PORTFOLIO_CHECKLIST.md) to understand what's needed.

### Step 2: Capture Screenshots
Follow [SCREENSHOT_GUIDE.md](./SCREENSHOT_GUIDE.md) to create 6 demo images/GIFs.

### Step 3: Test API
Use [POSTMAN_GUIDE.md](./POSTMAN_GUIDE.md) to import and test all endpoints.

### Step 4: Review Documentation
- Ensure README.md is complete ✅
- Verify SOCKET_EVENTS.md is accurate ✅
- Check all links work ✅

### Step 5: Update CV
Use metrics and highlights from PORTFOLIO_CHECKLIST.md to improve your CV.

---

## 📊 Documentation Status

| Document | Status | Priority | Action Needed |
|----------|--------|----------|---------------|
| README.md | ✅ Complete | 🔴 Critical | None |
| PORTFOLIO_CHECKLIST.md | ✅ Complete | 🔴 Critical | Follow the steps! |
| SCREENSHOT_GUIDE.md | ✅ Complete | 🔴 Critical | Capture 6 screenshots |
| POSTMAN_GUIDE.md | ✅ Complete | 🟠 High | Test all endpoints |
| SOCKET_EVENTS.md | ✅ Complete | 🟠 High | None |
| HVTSocial.postman_collection.json | ✅ Complete | 🟠 High | Import & test |
| Screenshots (assets/) | ❌ Missing | 🔴 Critical | **DO THIS NOW!** |
| Demo Video | ❌ Missing | 🟡 Medium | Optional but recommended |
| Database Schema Diagram | ❌ Missing | 🟡 Medium | Nice to have |

---

## 🎓 For Interviews

### Be prepared to explain:

1. **Architecture Decisions**
   - Why Socket.IO for real-time?
   - Why Cloudinary for media storage?
   - Why JWT with refresh tokens?

2. **Technical Challenges**
   - How did you handle WebRTC NAT traversal?
   - How do you prevent race conditions in chat?
   - How do you scale Socket.IO connections?

3. **Security Measures**
   - Refer to README.md Security section
   - Know CORS, Helmet, Rate Limiting details
   - Explain JWT token rotation

4. **Performance Optimizations**
   - Cursor-based pagination for feed
   - Image compression before upload
   - Database indexing strategies

---

## 🔗 External Links

- **Live Demo:** https://hvt-social.vercel.app
- **GitHub Repo:** https://github.com/HoTra171/HVTSocial
- **Swagger Docs:** `http://localhost:5000/api-docs` (when running locally)

---

## 📞 Contact

**Developer:** Hồ Viết Trà
**Email:** trabn1712003@gmail.com
**GitHub:** https://github.com/HoTra171

---

## 🆘 Need Help?

If you're stuck:
1. Check the specific guide for your task
2. Review code comments in `/Backend` and `/Frontend`
3. Check GitHub Issues
4. Reach out via email

---

## ✅ Final Pre-Submit Checklist

Before sharing your portfolio:

- [ ] All 6 screenshots captured and in `docs/assets/`
- [ ] README.md displays screenshots correctly
- [ ] Postman collection tested (all 50+ endpoints work)
- [ ] Live demo site is functional
- [ ] No secrets in Git history
- [ ] CV updated with new metrics
- [ ] LinkedIn profile updated
- [ ] Practice explaining your architecture
- [ ] Test portfolio on mobile & desktop

---

**Good luck with your applications! 🚀**

**Last Updated:** January 9, 2026
