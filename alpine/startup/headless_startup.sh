#!/bin/bash
### every exit != 0 fails the script
set -e

cd ${AGENT_DIR}
yarn start