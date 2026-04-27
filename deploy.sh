npm run build



rsync -r frontend/dist/* root@103.194.228.177:/var/www/mindmill

rsync -avzr backend/* root@103.194.228.177:/opt/backend/mindmill --exclude=node_modules 
scp backend/.env root@103.194.228.177:/opt/backend/mindmill
ssh root@103.194.228.177 "cd /opt/backend/mindmill && npm install --production"

# ssh root@103.194.228.177 "apt-get update && apt-get install -y libnss3 libatk-bridge2.0-0 libx11-xcb1 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2t64 libpango-1.0-0 libpangocairo-1.0-0 libgtk-3-0t64" || true

ssh root@103.194.228.177 "pm2 restart all && systemctl restart caddy && systemctl status caddy"
