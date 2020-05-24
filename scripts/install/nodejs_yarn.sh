#!/usr/bin/env bash
### every exit != 0 fails the script
set -e

# Install NodeJS 12.x
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs

# Install yarn
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt update && apt install yarn