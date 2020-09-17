#!/bin/bash
### every exit != 0 fails the script
set -e

cd ${PRODUCER_DIR}
npm start