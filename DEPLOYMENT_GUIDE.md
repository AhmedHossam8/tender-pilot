# 🚀 Deployment Guide - AI Features

## Overview
This guide provides step-by-step instructions for deploying the tender-pilot application with all AI features enabled and production-ready.

---

## Pre-Deployment Checklist

### ✅ Backend
- [x] All Django checks pass
- [x] Docker containers running
- [x] Database migrations complete
- [x] Static files collected
- [x] Environment variables configured
- [x] AI services initialized
- [x] API endpoints tested

### ✅ Frontend
- [x] No build errors
- [x] All routes configured
- [x] Environment variables set
- [x] API base URL configured
- [x] Assets optimized
- [x] Bundle size acceptable

---

## Environment Variables

### Backend (.env)
```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database (PostgreSQL)
DB_NAME=tender_pilot
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=db
DB_PORT=5432

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key  # Optional

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com

# Media and Static Files
MEDIA_URL=/media/
STATIC_URL=/static/
```

### Frontend (.env)
```bash
VITE_API_BASE_URL=https://your-backend-domain.com
VITE_APP_NAME=TenderPilot
```

---

## Deployment Steps

### 1. Backend Deployment (Docker)

```bash
# Navigate to backend directory
cd /home/gimy/ITI_FInal_project/tender-pilot/backend

# Build production images
docker-compose -f docker-compose.prod.yml build

# Run migrations
docker-compose -f docker-compose.prod.yml run backend python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml run backend python manage.py collectstatic --noinput

# Create superuser (if needed)
docker-compose -f docker-compose.prod.yml run backend python manage.py createsuperuser

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 2. Frontend Deployment (Build & Serve)

```bash
# Navigate to frontend directory
cd /home/gimy/ITI_FInal_project/tender-pilot/frontend

# Install dependencies
npm install

# Build for production
npm run build

# The build output is in ./dist/
# Deploy ./dist/ to your hosting provider (Netlify, Vercel, AWS S3, etc.)
```

### 3. Verify Deployment

```bash
# Test backend health
curl https://your-backend-domain.com/api/v1/projects/

# Test AI endpoints
bash test_ai_endpoints.sh

# Test frontend
# Open https://your-frontend-domain.com in browser
# Check console for errors
# Test all AI features manually
```

---

## Hosting Recommendations

### Backend
**Recommended**: Docker-based hosting
- **AWS ECS**: Elastic Container Service
- **Google Cloud Run**: Serverless containers
- **DigitalOcean App Platform**: Managed containers
- **Heroku**: Easy deployment with Procfile

### Frontend
**Recommended**: Static hosting with CDN
- **Vercel**: Automatic deployments from Git
- **Netlify**: Instant deploys with form handling
- **AWS S3 + CloudFront**: Scalable and fast
- **Cloudflare Pages**: Free with excellent performance

### Database
**Recommended**: Managed PostgreSQL
- **Neon**: Serverless PostgreSQL (currently used)
- **AWS RDS**: Managed database service
- **DigitalOcean Managed Databases**
- **Google Cloud SQL**

---

## AI Service Configuration

### Gemini API (Primary)
1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to backend .env: `GEMINI_API_KEY=your-key`
3. Free tier: 20 requests/day
4. Paid tier: Higher limits, recommended for production

### OpenAI API (Optional Fallback)
1. Get API key from: https://platform.openai.com/api-keys
2. Add to backend .env: `OPENAI_API_KEY=your-key`
3. Pricing: Pay-per-use
4. Not required - Gemini is primary provider

---

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl https://your-backend-domain.com/api/v1/projects/

# AI endpoints health
curl https://your-backend-domain.com/api/v1/ai/analytics/usage/

# Frontend health
curl https://your-frontend-domain.com
```

### Log Monitoring
```bash
# Backend logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Database logs
docker-compose -f docker-compose.prod.yml logs -f db

# Check for errors
docker-compose -f docker-compose.prod.yml logs --tail=100 backend | grep -i error
```

### Performance Monitoring
- Set up New Relic or Datadog for backend monitoring
- Use Google Analytics for frontend traffic
- Monitor API rate limits and costs
- Track AI service response times

---

## Scaling Considerations

### Backend Scaling
- **Horizontal**: Add more container instances behind load balancer
- **Vertical**: Increase container resources (CPU, RAM)
- **Database**: Use read replicas for heavy read workloads
- **Caching**: Add Redis for API response caching

### Frontend Scaling
- **CDN**: Use CloudFront or Cloudflare for global distribution
- **Bundle Optimization**: Code splitting and lazy loading
- **Image Optimization**: Use WebP format and responsive images
- **API Caching**: Implement service worker for offline support

### AI Service Scaling
- **Rate Limiting**: Implement queue for AI requests
- **Fallback Strategy**: Multiple AI providers for redundancy
- **Caching**: Cache AI responses for similar requests
- **Async Processing**: Use Celery for heavy AI tasks

---

## Security Checklist

### Backend
- [ ] DEBUG=False in production
- [ ] Strong SECRET_KEY (50+ characters)
- [ ] ALLOWED_HOSTS configured properly
- [ ] CORS_ALLOWED_ORIGINS restricted
- [ ] HTTPS enabled (SSL certificate)
- [ ] Database credentials secured
- [ ] API keys in environment variables
- [ ] Rate limiting enabled
- [ ] SQL injection protection (ORM)
- [ ] CSRF protection enabled

### Frontend
- [ ] Environment variables properly set
- [ ] API calls over HTTPS only
- [ ] XSS protection (React escaping)
- [ ] Content Security Policy headers
- [ ] Sensitive data not in local storage
- [ ] Authentication tokens secured
- [ ] Input validation on forms

---

## Rollback Plan

### Backend Rollback
```bash
# Stop current deployment
docker-compose -f docker-compose.prod.yml down

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Restore database if needed
# pg_restore -d tender_pilot backup.sql
```

### Frontend Rollback
- Vercel/Netlify: Use built-in rollback in dashboard
- S3/CloudFront: Upload previous build to S3
- Manual: Replace dist/ folder with backup

---

## Post-Deployment Testing

### Functional Tests
1. **User Authentication**
   - Register new account
   - Login with credentials
   - Password reset flow

2. **Core Features**
   - Create project
   - Submit bid
   - Browse services
   - Send messages

3. **AI Features**
   - Analyze bid strength
   - Get personalized recommendations
   - View trending opportunities
   - Real-time bid suggestions
   - AI analytics dashboard

### Performance Tests
- Page load time < 3 seconds
- API response time < 500ms
- Time to Interactive < 5 seconds
- Lighthouse score > 90

### Browser Tests
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

---

## Support & Maintenance

### Regular Tasks
- **Daily**: Check error logs, monitor uptime
- **Weekly**: Review AI usage and costs
- **Monthly**: Update dependencies, security patches
- **Quarterly**: Performance audit, cost optimization

### Common Issues

#### "AI analysis error 500"
- **Cause**: API rate limit exceeded
- **Solution**: Fallback logic activates automatically
- **Prevention**: Upgrade to paid API tier

#### "Recommendations not loading"
- **Cause**: Authentication token expired
- **Solution**: User needs to log in again
- **Prevention**: Implement refresh token logic

#### "Real-time suggestions slow"
- **Cause**: API latency or rate limiting
- **Solution**: Increase debounce delay
- **Prevention**: Add caching layer

---

## Contact & Resources

### Documentation
- Backend API: https://your-domain.com/api/docs/
- Frontend: See QUICK_START.md
- AI Features: See INTEGRATION_SUMMARY.md

### Support
- Issues: GitHub Issues
- Email: support@your-domain.com
- Slack: #tender-pilot

### External Services
- Gemini API: https://ai.google.dev/
- OpenAI API: https://platform.openai.com/
- Neon Database: https://neon.tech/

---

## ✅ Deployment Complete!

Once all steps are completed:
1. Backend should be accessible at your domain
2. Frontend should load without errors
3. All AI features should be functional
4. Error handling should work gracefully
5. Monitoring should be active

**Your application is now LIVE! 🎉**

For questions or issues, refer to PRODUCTION_READINESS.md for detailed feature documentation.
