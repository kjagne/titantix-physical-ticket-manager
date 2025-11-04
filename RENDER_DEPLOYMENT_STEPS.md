# 🚀 Render.com Deployment Steps

## ✅ Pre-Deployment Checklist

- [x] Git repository initialized
- [x] Initial commit created
- [x] Authentication system added
- [x] Database schema ready
- [x] render.yaml configuration file created
- [x] Environment variables configured
- [x] .gitignore properly set up

---

## 📋 Step-by-Step Deployment Guide

### Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com) and login
2. Click the "+" icon in top right → "New repository"
3. Repository name: `titantix-physical-ticket-manager` (or your preferred name)
4. Description: "Physical Ticket Management System with QR Codes and Authentication"
5. Choose: **Public** or **Private** (both work with Render)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

### Step 2: Push Code to GitHub

Copy and run these commands in your terminal:

```bash
cd /Users/mac/Downloads/titantix-physical-ticket-manager

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/titantix-physical-ticket-manager.git

# Push code to GitHub
git push -u origin main
```

**Example:**
```bash
git remote add origin https://github.com/johndoe/titantix-physical-ticket-manager.git
git push -u origin main
```

You'll be prompted for your GitHub credentials.

---

### Step 3: Deploy on Render.com

1. **Go to Render.com**
   - Visit [render.com](https://render.com)
   - Click "Get Started" or "Sign Up"
   - Sign up with GitHub (recommended) or email

2. **Connect GitHub Repository**
   - After signing in, click "New +" in the top right
   - Select "Blueprint"
   - Click "Connect GitHub" if not already connected
   - Authorize Render to access your repositories
   - Find and select your `titantix-physical-ticket-manager` repository

3. **Deploy Blueprint**
   - Render will automatically detect the `render.yaml` file
   - Review the services that will be created:
     - **titantix-api** (Backend Node.js service)
     - **titantix-web** (Frontend static site)
   - Click "Apply" to start deployment

4. **Wait for Deployment**
   - Backend API: ~5-10 minutes
   - Frontend Web: ~3-5 minutes
   - You'll see build logs in real-time
   - Wait for both services to show "Live" status

---

### Step 4: Configure Environment Variables

1. **Set JWT Secret (IMPORTANT!)**
   - Go to your `titantix-api` service dashboard
   - Click "Environment" in the left sidebar
   - Add environment variable:
     - Key: `JWT_SECRET`
     - Value: Generate a random secret (use a password generator)
     - Example: `7k9mP2xQ5wR8nL3vB6cF1hJ4gT0yU`
   - Click "Save Changes"
   - Service will automatically redeploy

2. **Verify Other Variables**
   - `NODE_ENV`: Should be set to `production`
   - `PORT`: Should be set to `4000`
   - These are auto-configured in render.yaml

---

### Step 5: Access Your Application

After deployment completes:

1. **Web Application**
   - URL: `https://titantix-web.onrender.com` (or your custom name)
   - This is your main application interface
   - Share this URL with your team

2. **API Backend**
   - URL: `https://titantix-api.onrender.com` (or your custom name)
   - This is for the Flutter scanner app
   - Update Flutter app configuration with this URL

3. **Test the Application**
   - Open the web URL
   - You should see the login screen
   - Login with: `admin@titantix.com` / `admin123`
   - Change the password immediately!

---

### Step 6: Update Flutter Scanner App

Update your Flutter app's API URL:

```dart
// In your Flutter app configuration
const String API_BASE_URL = 'https://titantix-api.onrender.com';
```

Rebuild and redeploy your Flutter app.

---

## 🔧 Post-Deployment Tasks

### 1. Change Default Admin Password
- [ ] Login with default credentials
- [ ] Register a new admin account with strong password
- [ ] Document new credentials securely

### 2. Test All Features
- [ ] Login/Register
- [ ] Generate tickets
- [ ] View all tickets
- [ ] Print tickets
- [ ] Delete tickets
- [ ] Save/Load designs

### 3. Configure Custom Domain (Optional)
1. Go to your service settings on Render
2. Click "Custom Domain"
3. Add your domain (e.g., tickets.yourdomain.com)
4. Update DNS records as instructed
5. SSL certificate is automatic

### 4. Set Up Monitoring
- [ ] Check Render dashboard for service health
- [ ] Monitor logs for errors
- [ ] Set up email alerts in Render settings

---

## 📊 Render Free Tier Limits

- **Web Services**: 750 hours/month (enough for 1 service running 24/7)
- **Static Sites**: Unlimited
- **Bandwidth**: 100 GB/month
- **Build Minutes**: 500 minutes/month
- **Disk Storage**: 1 GB (for database)

**Note**: Free tier services spin down after 15 minutes of inactivity. First request after spin-down may take 30-60 seconds.

---

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Render dashboard
- Verify all dependencies in package.json
- Ensure Node.js version is compatible (18+)

### Database Not Persisting
- Verify persistent disk is configured in render.yaml
- Check disk is mounted at correct path
- Review logs for database errors

### Authentication Not Working
- Verify JWT_SECRET is set
- Check CORS configuration
- Ensure API URL is correct in frontend

### Can't Access Application
- Check service status (should be "Live")
- Verify deployment completed successfully
- Check for any error logs
- Try accessing API directly: `https://your-api.onrender.com/api/stats`

---

## 💰 Upgrading to Paid Plan

If you need:
- Faster performance
- No spin-down
- More resources
- Priority support

Upgrade to Render's paid plans starting at $7/month per service.

---

## 📞 Support

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Status Page**: [status.render.com](https://status.render.com)

---

## ✅ Deployment Complete!

Once all steps are done:
- ✅ Application is live and accessible
- ✅ Database is persistent
- ✅ Authentication is working
- ✅ Flutter app can connect
- ✅ Ready for production use

**Your Titantix system is now deployed and ready to manage tickets! 🎫**
