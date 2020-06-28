#!/bin/bash
set -e

if [ -z "${PORT}" ]; then
  PORT="${NGINX_PORT}"
fi

echo "PORT: ${PORT}"

NGINX_CONFIG="
worker_processes auto;
worker_rlimit_nofile 65535;

events {
  multi_accept on;
  worker_connections 65535;
}

http {
  charset utf-8;
  sendfile on;
  tcp_nopush on;
  tcp_nodelay on;
  server_tokens off;
  log_not_found off;
  types_hash_max_size 2048;
  client_max_body_size 16M;

  # MIME
  include conf/mime.types;
  default_type application/octet-stream;

  server {
    listen ${PORT};
    listen [::]:${PORT};

    server_name proxy;
    
    include conf/letsencrypt.conf;

    # request start with /vnc, redirect to vnc server
    location ~* ^\/vnc$ {
      return 301 /vnc/\$1;
    }
    location ~* ^\/vnc(.+)$ {
      proxy_pass http://127.0.0.1:${NOVNC_PORT}\$1;
      include conf/proxy.conf;
    }
    location ~* ^\/websockify(.*)$ {
      proxy_pass http://127.0.0.1:${NOVNC_PORT}\$1;
      include conf/proxy.conf;
    }

    # by default proxy to headless server
    location / {
      proxy_pass http://127.0.0.1:${HEADLESS_PORT};
      include conf/proxy.conf;
    }
  }
}
"

echo "$NGINX_CONFIG" > ${NGINX_DIR}/nginx.conf

echo "generate nginx.conf to ${NGINX_DIR}/nginx.conf"

cat ${NGINX_DIR}/nginx.conf