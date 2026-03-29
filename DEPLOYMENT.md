# Mindmill Production Deployment with Subdomain Routing

## Architecture Overview

```
Browser → *.mindmill.com → Nginx (wildcard) → Backend API (port 5005)
                          → Frontend SPA (port 5173 → built dist)
```

## Step 1: DNS Configuration

Add these DNS records at your domain registrar:

```
Type    Name                Value               TTL
A       mindmill.com        YOUR_SERVER_IP      300
A       *.mindmill.com      YOUR_SERVER_IP      300
```

The `*` wildcard record ensures `demo-org.mindmill.com`, `acme.mindmill.com`, etc. all point to your server.

## Step 2: Wildcard SSL Certificate (Certbot)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get wildcard SSL (requires DNS challenge, not HTTP)
sudo certbot certonly --manual --preferred-challenges dns \
  -d "mindmill.com" \
  -d "*.mindmill.com"

# Follow prompts — you'll need to add TXT records to DNS
# Certificate will be at: /etc/letsencrypt/live/mindmill.com/
```

## Step 3: Deploy with Docker Compose

```bash
cd /home/dargon/projects/mindmill_
docker-compose up -d
```

Or deploy manually with Nginx (see nginx.conf).
