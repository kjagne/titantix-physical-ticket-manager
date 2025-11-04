# Titantix Deployment Guide

## Overview
This guide will help you deploy the Titantix Physical Ticket Manager system online.

## Prerequisites
- Git repository (GitHub, GitLab, or Bitbucket)
- Account on a hosting platform (Render, Railway, or Heroku)

---

## Option 1: Deploy to Render.com (Recommended - Free Tier Available)

### Step 1: Prepare Your Repository
1. Initialize git if not already done:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. Push to GitHub:
   ```bash
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect the `render.yaml` file
5. Click "Apply" to create both services (API and Web)

### Step 3: Configure Environment
The `render.yaml` file is already configured with:
- **Backend API**: Node.js service with persistent disk for SQLite database
- **Frontend Web**: Static site built from React app
- Automatic API URL configuration

### Step 4: Access Your Application
- Web App: `https://titantix-web.onrender.com`
- API: `https://titantix-api.onrender.com`

---

## Option 2: Deploy to Railway.app

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Initialize
```bash
railway login
railway init
```

### Step 3: Deploy
```bash
railway up
```

### Step 4: Add Environment Variables
```bash
railway variables set NODE_ENV=production
railway variables set PORT=4000
```

---

## Option 3: Deploy to Heroku

### Step 1: Install Heroku CLI
Download from [heroku.com/cli](https://devcenter.heroku.com/articles/heroku-cli)

### Step 2: Create Heroku App
```bash
heroku login
heroku create titantix-app
```

### Step 3: Add Buildpack
```bash
heroku buildpacks:add heroku/nodejs
```

### Step 4: Deploy
```bash
git push heroku main
```

### Step 5: Configure
```bash
heroku config:set NODE_ENV=production
```

---

## Option 4: Self-Hosted VPS (DigitalOcean, Linode, AWS EC2)

### Step 1: Setup Server
1. Create a Ubuntu server (20.04 or later)
2. SSH into your server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

### Step 2: Install Dependencies
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 for process management
npm install -g pm2

# Install Nginx for reverse proxy
apt install -y nginx
```

### Step 3: Clone and Setup Project
```bash
# Clone your repository
git clone YOUR_REPO_URL /var/www/titantix
cd /var/www/titantix

# Install dependencies
npm install

# Build frontend
npm run build

# Start server with PM2
pm2 start server.js --name titantix-api
pm2 save
pm2 startup
```

### Step 4: Configure Nginx
Create `/etc/nginx/sites-available/titantix`:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/titantix /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: Setup SSL (Optional but Recommended)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## Flutter App Configuration

After deployment, update your Flutter app to use the production API:

In your Flutter app's configuration:
```dart
// Replace localhost with your production URL
const String API_BASE_URL = 'https://titantix-api.onrender.com';
```

---

## Database Persistence

### Important Notes:
- **Render**: Uses persistent disk (configured in render.yaml)
- **Railway**: Automatic volume mounting
- **Heroku**: Requires PostgreSQL addon (SQLite not persistent)
- **VPS**: Database stored in project directory

### Backup Strategy:
```bash
# Backup database
cp titantix.db titantix.db.backup

# Restore database
cp titantix.db.backup titantix.db
```

---

## Monitoring and Logs

### Render:
- View logs in Render dashboard
- Automatic health checks

### Railway:
```bash
railway logs
```

### Heroku:
```bash
heroku logs --tail
```

### VPS with PM2:
```bash
pm2 logs titantix-api
pm2 monit
```

---

## Troubleshooting

### Issue: Database not persisting
**Solution**: Ensure persistent disk/volume is configured

### Issue: CORS errors
**Solution**: Update CORS configuration in server.js to allow your domain

### Issue: Build fails
**Solution**: Check Node.js version (requires 18+)

### Issue: Flutter app can't connect
**Solution**: 
1. Check API URL in Flutter app
2. Ensure API is accessible (test with browser)
3. Check CORS settings

---

## Cost Estimates

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| Render | 750 hours/month | $7/month |
| Railway | $5 credit/month | Pay as you go |
| Heroku | Hobby tier | $7/month |
| DigitalOcean | N/A | $5/month |

---

## Support

For issues or questions:
1. Check server logs
2. Verify environment variables
3. Test API endpoints manually
4. Check database file permissions

---

## Next Steps After Deployment

1. ✅ Test ticket generation
2. ✅ Test ticket scanning with Flutter app
3. ✅ Setup regular database backups
4. ✅ Configure custom domain (optional)
5. ✅ Setup monitoring/alerts
6. ✅ Document API endpoints for team
