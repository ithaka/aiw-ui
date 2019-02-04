#!/usr/bin/env bash

set -ex

SRC_DIR=$1 #  root folder of the workspace, /opt/git/workspace
BUILD_DIR=$2 # /mnt/deb-builds/${PACKAGE_NAME}-${VERSION}
PACKAGE_NAME=$3 # appName
VERSION=$4 # autogenerated timestamp
# Timeouting commands shell script helper
# http://stackoverflow.com/a/687994/315168
TIMEOUT=./timeout.sh
echo "Using package $PACKAGE_NAME and version ${VERSION}"

cd $SRC_DIR

# Grab a newer node.js
wget https://nodejs.org/dist/v10.9.0/node-v10.9.0-linux-x64.tar.xz
xz -dc node-v10.9.0-linux-x64.tar.xz | tar xf - -C /usr/local/

export PATH=/usr/local/node-v10.9.0-linux-x64/bin:$PATH

# Get Yarn and use it for NPM dependencies
npm install --global yarn

# Install global build packages
yarn global add webpack webpack-dev-server karma karma-cli protractor typescript rimraf phantomjs-prebuilt

# Install dependencies
yarn install

# Build the project! (uses Webpack)
# - sleep acts as a failsafe for broken dependencies stalling builds
echo "Starting webpack build"
$TIMEOUT -t 600 yarn run build:prod

# Styleguide
npm install --global nucleus-styleguide
yarn styleguide

# Collect our built files
rsync -a ${SRC_DIR}/dist/avatar/* ${BUILD_DIR}/

# Package our built app
tar -cvzf package.tgz ${SRC_DIR}/dist/avatar/
