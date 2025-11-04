# 🚂 Railway.app Deployment Guide

## Why Railway?
- ✅ **$5 FREE credit every month** (no credit card required initially)
- ✅ **No spin-down** on free tier (always active!)
- ✅ **Easy deployment** from GitHub
- ✅ **Automatic HTTPS** with custom domains
- ✅ **Built-in database support**
- ✅ **Great developer experience**

---

## 📋 Quick Deployment Steps

### Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Login"** or **"Start a New Project"**
3. **Sign in with GitHub** (recommended)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose: **`kjagne/titantix-physical-ticket-manager`**
4. Railway will automatically detect your Node.js app

### Step 3: Configure the Deployment

Railway will auto-detect settings, but verify:

1. **Build Command**: `npm run build`
2. **Start Command**: `node server.js`
3. **Node Version**: 18.x (auto-detected)

Click **"Deploy"** and wait 3-5 minutes.

### Step 4: Add Environment Variables

After deployment starts:

1. Go to your project dashboard
2. Click on your service
3. Go to **"Variables"** tab
4. Add these variables:

```
NODE_ENV=production
PORT=4000
JWT_SECRET=Railway2024SecureKey!Change-This-Now
```

**Important**: Generate a strong JWT_SECRET!

### Step 5: Enable Public Domain

1. Go to **"Settings"** tab
2. Scroll to **"Networking"**
3. Click **"Generate Domain"**
4. You'll get a URL like: `https://titantix-production.up.railway.app`

---

## 🎯 Your Deployment URLs

After deployment:
- **Full App**: `https://your-app-name.up.railway.app`
- **API Endpoint**: `https://your-app-name.up.railway.app/api`
- **Login**: Use `admin@titantix.com` / `admin123`

---

## 📦 What Gets Deployed

Railway will:
1. ✅ Clone your GitHub repo
2. ✅ Install dependencies (`npm ci`)
3. ✅ Build frontend (`npm run build`)
4. ✅ Start server (`node server.js`)
5. ✅ Serve frontend from `/dist`
6. ✅ Create SQLite database in persistent volume

---

## 💾 Database Persistence

Railway automatically provides persistent storage:
- Your `titantix.db` file is saved
- Data persists across deployments
- Automatic backups available

**No additional configuration needed!**

---

## 🔄 Automatic Deployments

Railway automatically redeploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push origin main

# Railway automatically detects and redeploys!
```

---

## 💰 Railway Pricing & Free Tier

### Free Trial
- **$5 credit/month** (no credit card required)
- **500 hours of usage** (~20 days of 24/7 operation)
- **100 GB bandwidth**
- **No spin-down** (stays active!)

### Usage Estimation for Titantix:
- **Typical usage**: $3-5/month
- **Your $5 credit covers**: Full month of operation
- **After free credit**: Pay only for what you use

### Hobby Plan ($5/month)
- **$5 credit included**
- **500 execution hours**
- **100 GB bandwidth**
- **8 GB RAM**
- **8 GB disk**

---

## 🔧 Post-Deployment Configuration

### 1. Update Flutter Scanner App

Update your Flutter app's API URL:

```dart
// lib/config.dart or wherever you store config
const String API_BASE_URL = 'https://your-app-name.up.railway.app';
```

### 2. Test All Endpoints

```bash
# Test API health
curl https://your-app-name.up.railway.app/api/stats

# Should return: {"total":0,"used":0,"sold":0,"unsold":0}
```

### 3. Change Default Password

1. Login to web app
2. Register new admin account
3. Use strong password
4. Document credentials securely

---

## 📊 Monitoring Your App

### View Logs
1. Go to your project on Railway
2. Click on your service
3. Go to **"Deployments"** tab
4. Click on latest deployment
5. View real-time logs

### Check Metrics
- **CPU Usage**
- **Memory Usage**
- **Network Traffic**
- **Request Count**

All available in Railway dashboard!

---

## 🐛 Troubleshooting

### Build Fails

**Check logs for errors:**
```
Error: Cannot find module 'xyz'
```
**Solution**: Add missing dependency to `package.json`

### Application Crashes

**Check server logs:**
```
Error: ENOENT: no such file or directory
```
**Solution**: Verify file paths are correct for production

### Database Not Persisting

**Solution**: Railway automatically handles this, but verify:
1. Check that `titantix.db` is created
2. Look for database errors in logs
3. Ensure write permissions

### Can't Access Application

**Check:**
1. ✅ Deployment status is "Active"
2. ✅ Domain is generated
3. ✅ No errors in logs
4. ✅ Environment variables are set

---

## 🚀 Advanced Configuration

### Custom Domain

1. Go to **"Settings"** → **"Networking"**
2. Click **"Custom Domain"**
3. Add your domain: `tickets.yourdomain.com`
4. Update DNS records:
   ```
   CNAME tickets your-app-name.up.railway.app
   ```
5. SSL certificate is automatic!

### Add Database Backup

Railway Pro feature:
- Automatic daily backups
- Point-in-time recovery
- One-click restore

### Scale Your App

If you need more resources:
1. Go to **"Settings"**
2. Adjust **"Resources"**
3. Increase RAM/CPU as needed
4. Pay only for what you use

---

## 📈 Cost Optimization Tips

### Stay Within Free Credit

1. **Monitor usage** in Railway dashboard
2. **Optimize code** to reduce CPU usage
3. **Use caching** where possible
4. **Compress responses** to save bandwidth

### Typical Monthly Costs

For a ticket management system:
- **Light usage** (< 1000 tickets/month): $2-3
- **Medium usage** (1000-5000 tickets): $3-5
- **Heavy usage** (5000+ tickets): $5-10

**Your $5 free credit should cover most use cases!**

---

## 🔐 Security Best Practices

### 1. Secure JWT Secret
```bash
# Generate strong secret
openssl rand -base64 32
```

### 2. Enable CORS Properly
Already configured in `server.js`

### 3. Use HTTPS Only
Railway provides automatic SSL

### 4. Regular Updates
```bash
npm update
git add package-lock.json
git commit -m "Update dependencies"
git push
```

---

## 📞 Support & Resources

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Status Page**: https://status.railway.app
- **Pricing**: https://railway.app/pricing

---

## ✅ Deployment Checklist

- [ ] Signed up for Railway
- [ ] Connected GitHub repository
- [ ] Deployed application
- [ ] Added environment variables (JWT_SECRET)
- [ ] Generated public domain
- [ ] Tested web application
- [ ] Tested API endpoints
- [ ] Changed default admin password
- [ ] Updated Flutter app URL
- [ ] Tested ticket generation
- [ ] Tested ticket scanning
- [ ] Monitored logs for errors
- [ ] Set up monitoring alerts

---

## 🎉 Success!

Once deployed, your Titantix system will be:
- ✅ **Live 24/7** (no spin-down!)
- ✅ **Fast and responsive**
- ✅ **Automatically backed up**
- ✅ **Secure with HTTPS**
- ✅ **Easy to update** (just push to GitHub)

**Your ticket management system is production-ready! 🎫**

---

## 💡 Next Steps After Deployment

1. **Share the URL** with your team
2. **Generate test tickets** to verify everything works
3. **Update Flutter scanner** with production URL
4. **Train users** on the system
5. **Monitor usage** and costs
6. **Plan for scaling** if needed

**Need help? Check the Railway Discord or documentation!**
