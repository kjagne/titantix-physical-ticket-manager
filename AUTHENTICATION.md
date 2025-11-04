# 🔐 Titantix Authentication System

## Overview
Your Titantix system now has a complete email/password authentication system to secure access to the ticket management platform.

## Features
- ✅ Email & Password Login
- ✅ User Registration
- ✅ JWT Token-based Authentication
- ✅ Secure Password Hashing (bcrypt)
- ✅ Protected API Routes
- ✅ Persistent Sessions
- ✅ User Profile Display
- ✅ Logout Functionality

---

## Default Admin Account

When you first start the server, a default admin account is automatically created:

```
Email: admin@titantix.com
Password: admin123
```

⚠️ **IMPORTANT**: Change this password immediately after first login!

---

## How It Works

### 1. Login Flow
1. User enters email and password
2. Server verifies credentials
3. Server generates JWT token (valid for 7 days)
4. Token stored in browser localStorage
5. Token sent with all API requests

### 2. Protected Routes
The following routes require authentication:
- `POST /api/tickets/bulk` - Create tickets
- `POST /api/designs` - Save designs
- `GET /api/designs` - Get designs
- `DELETE /api/designs/:id` - Delete designs

### 3. Public Routes
These routes don't require authentication:
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/tickets` - Get tickets (for Flutter app)
- `POST /api/tickets/sync` - Sync tickets (for Flutter app)
- `GET /api/stats` - Get statistics

---

## User Management

### Register New User
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword",
    "name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@titantix.com",
    "password": "admin123"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-1234567890",
    "email": "admin@titantix.com",
    "name": "Admin",
    "role": "admin"
  }
}
```

### Get Current User
```bash
curl -X GET http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Frontend Integration

### Login Component
The system includes a beautiful login/register screen at `/components/Login.tsx`

Features:
- Toggle between Login and Register
- Form validation
- Error handling
- Loading states
- Default credentials display

### Authentication State
The main `App.tsx` manages authentication:
- Checks for existing token on load
- Shows login screen if not authenticated
- Passes user info to Header
- Handles logout

### API Calls
All API calls automatically include the auth token from localStorage via the `getAuthHeaders()` method in `api-database.ts`.

---

## Security Features

### Password Hashing
- Uses bcrypt with salt rounds of 10
- Passwords never stored in plain text
- One-way hashing (cannot be reversed)

### JWT Tokens
- Signed with secret key
- Expires after 7 days
- Contains user ID and email
- Verified on every protected request

### Token Storage
- Stored in browser localStorage
- Automatically included in API requests
- Cleared on logout

---

## Environment Variables

For production, set these environment variables:

```bash
# Required for production
JWT_SECRET=your-super-secret-key-change-this-in-production

# Optional
NODE_ENV=production
PORT=4000
```

⚠️ **CRITICAL**: Change `JWT_SECRET` in production! Never use the default.

---

## Deployment Considerations

### 1. Change Default Credentials
After deployment, immediately:
1. Login with default admin account
2. Register a new admin account with strong password
3. Delete or disable the default account (future feature)

### 2. Set JWT Secret
```bash
# On Render.com
render config:set JWT_SECRET=your-random-secret-key

# On Heroku
heroku config:set JWT_SECRET=your-random-secret-key

# On Railway
railway variables set JWT_SECRET=your-random-secret-key
```

### 3. HTTPS Only
In production, ensure your site uses HTTPS to protect tokens in transit.

### 4. Token Expiration
Tokens expire after 7 days. Users will need to login again after expiration.

---

## Troubleshooting

### "No token provided" Error
- User not logged in
- Token expired
- Token not in localStorage
- **Solution**: Login again

### "Invalid or expired token" Error
- Token has expired (>7 days old)
- Token was tampered with
- JWT_SECRET changed
- **Solution**: Login again

### "User already exists" Error
- Email already registered
- **Solution**: Use different email or login

### Can't access protected routes
- Check token is in localStorage: `localStorage.getItem('token')`
- Check token is being sent in Authorization header
- Check server logs for auth errors

---

## API Endpoints Reference

### Authentication
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| GET | `/api/auth/me` | Yes | Get current user |

### Tickets
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/tickets` | No | Get all tickets |
| POST | `/api/tickets/bulk` | **Yes** | Create tickets |
| POST | `/api/tickets/sync` | No | Sync from Flutter |

### Designs
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/designs` | **Yes** | Get all designs |
| POST | `/api/designs` | **Yes** | Create design |
| DELETE | `/api/designs/:id` | **Yes** | Delete design |

### Stats
| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/stats` | No | Get statistics |

---

## Future Enhancements

Potential improvements for the authentication system:

1. **Password Reset**: Email-based password reset
2. **Email Verification**: Verify email addresses
3. **Role-Based Access**: Different permissions for different roles
4. **Multi-Factor Authentication**: SMS or authenticator app
5. **Session Management**: View and revoke active sessions
6. **Password Change**: Allow users to change password
7. **User Management UI**: Admin panel to manage users
8. **Audit Logs**: Track user actions
9. **Rate Limiting**: Prevent brute force attacks
10. **OAuth Integration**: Login with Google, Facebook, etc.

---

## Testing Authentication

### Test Login
1. Start the server: `npm run server`
2. Start the frontend: `npm run dev`
3. Open http://localhost:5173
4. Login with default credentials
5. You should see the main dashboard

### Test Protected Routes
```bash
# Without token (should fail)
curl -X POST http://localhost:4000/api/tickets/bulk \
  -H "Content-Type: application/json" \
  -d '{"tickets": []}'

# With token (should succeed)
curl -X POST http://localhost:4000/api/tickets/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"tickets": []}'
```

---

## Support

If you encounter issues:
1. Check server logs for error messages
2. Check browser console for frontend errors
3. Verify token exists in localStorage
4. Ensure server is running
5. Check API endpoint URLs are correct

---

## Summary

✅ **Authentication is now fully integrated!**

- Login screen protects access
- JWT tokens secure API calls
- User info displayed in header
- Logout clears session
- Ready for production deployment

**Next Steps:**
1. Test login/register functionality
2. Change default admin password
3. Set JWT_SECRET for production
4. Deploy with authentication enabled
