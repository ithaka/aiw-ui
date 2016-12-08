#!/usr/bin/env bash

set -ex

SRC_DIR=$1 #  root folder of the workspace, /opt/git/workspace
BUILD_DIR=$2 # /mnt/deb-builds/${PACKAGE_NAME}-${VERSION}
PACKAGE_NAME=$3 # appName
VERSION=$4 # autogenerated timestamp
echo "Using package $PACKAGE_NAME and version ${VERSION}"

cd $SRC_DIR

# Grab a newer node.js
wget https://nodejs.org/dist/v6.9.1/node-v6.9.1-linux-x64.tar.xz
xz -dc node-v6.9.1-linux-x64.tar.xz | tar xf - -C /usr/local/

# Install sass cause that's how we roll
gem install sass

export PATH=/usr/local/node-v6.9.1-linux-x64/bin:$PATH

# Get Yarn and use it for NPM dependencies
npm install --global yarn

# Install global build packages
yarn global add webpack webpack-dev-server karma karma-cli protractor typescript rimraf phantomjs

# Install dependencies
yarn install

# This is almost comical—-can we use yarn yet?
# npm-install-missing

# bower --allow-root install

# webpack our way to success
webpack --config config/webpack.prod.js  --progress --profile --bail

rsync -a ${SRC_DIR}/dist/* ${BUILD_DIR}/

tar -cvzf package.tgz ${SRC_DIR}/dist/