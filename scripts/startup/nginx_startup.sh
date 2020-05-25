#!/bin/bash
### every exit != 0 fails the script
set -e

nginx -c ${NGINX_DIR}/nginx.conf