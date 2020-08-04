# Create a new file
sudo nano /etc/nginx/sites-available/jsonbox

# File contents
upstream jsonbox_upstream {
  server 127.0.0.1:3001;
  keepalive 64;
}

server {
  listen 80;
  listen [::]:80;

  server_name api2.emailapi.io;
  location / {
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header Host $http_host;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_pass http://jsonbox_upstream/;
    proxy_redirect off;
    proxy_read_timeout 240s;
  }
}

# Link it
sudo ln -s /etc/nginx/sites-available/api2.emailapi.io /etc/nginx/sites-enabled/

# Setup certificate
sudo certbot --nginx -d api2.emailapi.io
