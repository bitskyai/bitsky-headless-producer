#!/bin/bash
### every exit != 0 fails the script
set -e

mkdir -p "$HOME/.nginx"
nginx -c ${NGINX_DIR}/nginx.conf