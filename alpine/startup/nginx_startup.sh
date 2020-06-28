#!/bin/bash
### every exit != 0 fails the script
set -e

sudo nginx -c ${NGINX_DIR}/nginx.conf