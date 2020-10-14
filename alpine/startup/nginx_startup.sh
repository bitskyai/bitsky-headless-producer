#!/bin/bash
### every exit != 0 fails the script
set -e

echo "Prepare to start nginx ... "

# tmp comment, cannot use sudo in heroku env
# sudo nginx -c ${NGINX_DIR}/nginx.conf

nginx -c ${NGINX_DIR}/nginx.conf

echo "Start nginx successful..."
ps aux | grep nginx