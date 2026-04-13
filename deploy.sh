npm run build



rsync -r frontend/dist/* root@103.194.228.177:/var/www/mindmill

rsync -avzr backend/* root@103.194.228.177:/opt/backend/mindmill --exclude=node_modules 
scp backend/.env root@103.194.228.177:/opt/backend/mindmill
ssh root@103.194.228.177 "pm2 restart all && systemctl restart caddy && systemctl status caddy"
