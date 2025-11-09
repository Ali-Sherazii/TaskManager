# Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the Task Management System REST API to production.

## Prerequisites

- Node.js 18+ installed
- MongoDB database (local or cloud)
- Environment variables configured
- SSL certificate (for HTTPS)
- Domain name (optional)

---

## 1. Environment Setup

### Create `.env` file

Create a `.env` file in the `backend` directory with the following variables:

```env
# Server Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRES_IN=24h

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/taskmanager
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskmanager

# Security (Optional)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Best Practices

1. **Generate Strong JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Use Environment-Specific Secrets:**
   - Never commit `.env` files to version control
   - Use different secrets for development, staging, and production
   - Rotate secrets regularly

3. **MongoDB Security:**
   - Use strong passwords
   - Enable authentication
   - Use connection strings with authentication
   - Enable SSL/TLS for MongoDB connections
   - Restrict network access

---

## 2. Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create MongoDB Atlas Account:**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for a free account

2. **Create Cluster:**
   - Create a new cluster (M0 free tier is available)
   - Choose a cloud provider and region
   - Wait for cluster to be created

3. **Configure Database Access:**
   - Go to "Database Access"
   - Create a database user with strong password
   - Set user privileges (read/write to any database)

4. **Configure Network Access:**
   - Go to "Network Access"
   - Add IP address (0.0.0.0/0 for development, specific IPs for production)
   - Or use VPC peering for better security

5. **Get Connection String:**
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Update `MONGODB_URI` in `.env`

### Local MongoDB

1. **Install MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install mongodb

   # macOS
   brew install mongodb-community

   # Windows
   # Download from https://www.mongodb.com/try/download/community
   ```

2. **Start MongoDB:**
   ```bash
   # Linux
   sudo systemctl start mongod

   # macOS
   brew services start mongodb-community

   # Windows
   net start MongoDB
   ```

3. **Create Database:**
   ```bash
   mongosh
   use taskmanager
   ```

---

## 3. Install Dependencies

```bash
cd backend
npm install --production
```

---

## 4. Security Enhancements

### Add Security Middleware

Install additional security packages:

```bash
npm install helmet express-rate-limit
```

### Update `server.js`

Add security middleware:

```javascript
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
```

---

## 5. Process Management

### Using PM2 (Recommended)

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Start Application:**
   ```bash
   pm2 start server.js --name task-manager-api
   ```

3. **Save PM2 Configuration:**
   ```bash
   pm2 save
   pm2 startup
   ```

4. **PM2 Commands:**
   ```bash
   pm2 list              # List all processes
   pm2 logs task-manager-api  # View logs
   pm2 restart task-manager-api  # Restart application
   pm2 stop task-manager-api     # Stop application
   pm2 delete task-manager-api   # Delete process
   ```

### Using Systemd (Linux)

1. **Create Service File:**
   ```bash
   sudo nano /etc/systemd/system/task-manager-api.service
   ```

2. **Add Configuration:**
   ```ini
   [Unit]
   Description=Task Manager API
   After=network.target

   [Service]
   Type=simple
   User=your-user
   WorkingDirectory=/path/to/backend
   ExecStart=/usr/bin/node server.js
   Restart=on-failure
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. **Start Service:**
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable task-manager-api
   sudo systemctl start task-manager-api
   ```

---

## 6. Reverse Proxy (Nginx)

### Install Nginx

```bash
# Ubuntu/Debian
sudo apt-get install nginx

# macOS
brew install nginx
```

### Configure Nginx

Create configuration file:

```bash
sudo nano /etc/nginx/sites-available/task-manager-api
```

Add configuration:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy Settings
    location / {
        proxy_pass http://localhost:3000;
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

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/task-manager-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. SSL Certificate (Let's Encrypt)

### Install Certbot

```bash
sudo apt-get install certbot python3-certbot-nginx
```

### Obtain Certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

### Auto-Renewal

Certbot automatically sets up renewal. Test with:

```bash
sudo certbot renew --dry-run
```

---

## 8. Monitoring and Logging

### Application Logs

1. **PM2 Logs:**
   ```bash
   pm2 logs task-manager-api
   ```

2. **Systemd Logs:**
   ```bash
   sudo journalctl -u task-manager-api -f
   ```

### Log Rotation

Configure log rotation for PM2:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Monitoring Tools

Consider using:
- **PM2 Plus**: Built-in monitoring for PM2
- **New Relic**: Application performance monitoring
- **Datadog**: Infrastructure and application monitoring
- **Sentry**: Error tracking and monitoring

---

## 9. Backup Strategy

### MongoDB Backup

1. **Automated Backup Script:**
   ```bash
   #!/bin/bash
   BACKUP_DIR="/path/to/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   mongodump --uri="mongodb://localhost:27017/taskmanager" --out="$BACKUP_DIR/$DATE"
   ```

2. **Schedule with Cron:**
   ```bash
   # Daily backup at 2 AM
   0 2 * * * /path/to/backup-script.sh
   ```

### MongoDB Atlas Backup

MongoDB Atlas provides automated backups:
- Go to "Clusters" → "Backup"
- Enable continuous backups
- Configure backup retention policy

---

## 10. Performance Optimization

### Database Indexing

Ensure indexes are created:

```javascript
// MongoDB indexes are automatically created by Mongoose
// Verify with:
db.tasks.getIndexes()
db.users.getIndexes()
db.sessions.getIndexes()
```

### Caching

Consider implementing Redis for:
- Session storage
- Rate limiting
- Frequently accessed data

### Load Balancing

For high traffic, use load balancing:
- **Nginx**: HTTP load balancing
- **HAProxy**: Advanced load balancing
- **Cloud Load Balancer**: AWS ELB, Google Cloud Load Balancer

---

## 11. Health Checks

### Application Health Check

The API includes a health check endpoint:

```bash
curl http://localhost:3000/health
```

### Monitoring Health Checks

Set up monitoring to check:
- Application health endpoint
- Database connectivity
- Response times
- Error rates

---

## 12. Deployment Checklist

- [ ] Environment variables configured
- [ ] MongoDB database set up and accessible
- [ ] SSL certificate installed
- [ ] Reverse proxy configured
- [ ] Process manager installed (PM2/systemd)
- [ ] Logging configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error tracking configured
- [ ] Performance monitoring enabled
- [ ] Documentation updated
- [ ] Load testing completed
- [ ] Disaster recovery plan documented

---

## 13. Troubleshooting

### Common Issues

1. **Application Won't Start:**
   - Check environment variables
   - Verify MongoDB connection
   - Check port availability
   - Review application logs

2. **Database Connection Issues:**
   - Verify MongoDB is running
   - Check connection string
   - Verify network access
   - Check firewall rules

3. **High Memory Usage:**
   - Review application code
   - Check for memory leaks
   - Optimize database queries
   - Consider scaling horizontally

4. **Slow Response Times:**
   - Check database performance
   - Review query optimization
   - Check network latency
   - Consider caching

---

## 14. Maintenance

### Regular Maintenance Tasks

1. **Update Dependencies:**
   ```bash
   npm audit
   npm update
   ```

2. **Database Maintenance:**
   - Monitor database size
   - Clean up old sessions
   - Optimize indexes
   - Review query performance

3. **Security Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Review access logs
   - Rotate secrets regularly

4. **Performance Monitoring:**
   - Monitor response times
   - Check error rates
   - Review resource usage
   - Optimize as needed

---

## 15. Support

For issues or questions:
- Check application logs
- Review error messages
- Consult API documentation
- Contact development team

---

## Additional Resources

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)


