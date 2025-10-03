# Deployment Guide

This guide covers deploying the Rewardz application to production environments.

## Prerequisites

- Node.js 18+
- Docker (optional)
- Domain name
- SSL certificate
- Firebase project
- Stripe account
- PayPal account
- Google Cloud account

## Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Server-side Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Payment Processing
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal Configuration
VITE_PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_CLIENT_ID=your_live_paypal_client_id
PAYPAL_SECRET=your_live_paypal_secret
PAYPAL_ENV=live

# Google Vision API
GOOGLE_VISION_API_KEY=your_google_vision_api_key
VITE_VISION_ENABLED=1

# Email Service
RESEND_API_KEY=re_...
RESEND_FROM=notifications@yourdomain.com

# Server Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
PING_MESSAGE=Rewardz API is running

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment Options

### 1. Netlify (Recommended)

#### Automatic Deployment
1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: `pnpm build`
   - Publish directory: `dist/spa`
   - Node version: `18`
3. Set environment variables in Netlify dashboard
4. Deploy!

#### Manual Deployment
```bash
# Build the application
pnpm build

# Deploy to Netlify
npx netlify deploy --prod --dir=dist/spa
```

### 2. Vercel

#### Automatic Deployment
1. Connect your GitHub repository to Vercel
2. Configure build settings:
   - Framework: Vite
   - Build command: `pnpm build`
   - Output directory: `dist/spa`
3. Set environment variables in Vercel dashboard
4. Deploy!

### 3. Docker Deployment

#### Build Docker Image
```bash
docker build -t rewardz .
```

#### Run with Docker Compose
```bash
docker-compose up -d
```

#### Custom Docker Deployment
```bash
# Build image
docker build -t rewardz .

# Run container
docker run -d \
  --name rewardz \
  -p 8080:8080 \
  --env-file .env \
  rewardz
```

### 4. Traditional Server Deployment

#### Prerequisites
- Ubuntu 20.04+ or similar
- Nginx
- PM2 or similar process manager
- SSL certificate

#### Setup Steps

1. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install pnpm**
```bash
npm install -g pnpm
```

3. **Clone and setup application**
```bash
git clone https://github.com/your-username/rewardz.git
cd rewardz
pnpm install
pnpm build
```

4. **Install PM2**
```bash
npm install -g pm2
```

5. **Create PM2 ecosystem file**
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'rewardz',
    script: 'dist/server/node-build.mjs',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    }
  }]
}
```

6. **Start application**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

7. **Configure Nginx**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        root /path/to/rewardz/dist/spa;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Firebase Configuration

### 1. Authentication
- Enable Email/Password authentication
- Configure authorized domains
- Set up password reset templates

### 2. Firestore Database
- Create database in production mode
- Deploy security rules:
```bash
firebase deploy --only firestore:rules
```

### 3. Storage
- Deploy storage rules:
```bash
firebase deploy --only storage
```

### 4. Hosting (Optional)
```bash
firebase deploy --only hosting
```

## Payment Configuration

### Stripe
1. Create production API keys
2. Configure webhook endpoints:
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `payment_intent.succeeded`
3. Test webhook endpoints

### PayPal
1. Create production app credentials
2. Configure return URLs
3. Test payment flows

## SSL Certificate

### Let's Encrypt (Free)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Commercial Certificate
1. Purchase SSL certificate
2. Install certificate files
3. Configure Nginx with certificate paths

## Monitoring and Logging

### 1. Application Monitoring
- Set up Sentry for error tracking
- Configure log aggregation
- Set up uptime monitoring

### 2. Performance Monitoring
- Monitor response times
- Track error rates
- Monitor resource usage

### 3. Security Monitoring
- Set up intrusion detection
- Monitor failed login attempts
- Track suspicious activity

## Backup Strategy

### 1. Database Backups
```bash
# Firestore backup
gcloud firestore export gs://your-backup-bucket/firestore-backup
```

### 2. File Backups
```bash
# Firebase Storage backup
gsutil -m cp -r gs://your-storage-bucket gs://your-backup-bucket/storage-backup
```

### 3. Application Backups
```bash
# Backup application files
tar -czf rewardz-backup-$(date +%Y%m%d).tar.gz /path/to/rewardz
```

## Health Checks

### Application Health
```bash
curl https://yourdomain.com/health
```

### Database Health
```bash
# Check Firestore connection
curl https://yourdomain.com/api/ping
```

## Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version
   - Verify environment variables
   - Check for TypeScript errors

2. **Runtime Errors**
   - Check logs: `pm2 logs rewardz`
   - Verify environment variables
   - Check database connections

3. **Performance Issues**
   - Monitor resource usage
   - Check database query performance
   - Optimize images and assets

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=debug
pm2 restart rewardz
```

## Security Checklist

- [ ] SSL certificate installed
- [ ] Environment variables secured
- [ ] Firebase security rules deployed
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation enabled
- [ ] Error handling implemented
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Security headers configured

## Maintenance

### Regular Tasks
- Monitor application logs
- Check database performance
- Update dependencies
- Review security settings
- Test backup procedures

### Updates
```bash
# Update dependencies
pnpm update

# Rebuild and restart
pnpm build
pm2 restart rewardz
```
