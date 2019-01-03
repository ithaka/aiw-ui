#!/bin/bash
if [ "$1" = "prod" ]; then
    ENVIRONMENT="prod"
else
    ENVIRONMENT="test"
fi
APP_NAME="artstor-ui"
SAGOKU_BUILD_USER="cody.pumper@ithaka.org"
GIT_SHA=$(git rev-parse HEAD)
IMAGE="artifactory.acorn.cirrostratus.org/artstor-air-node:${GIT_SHA:0:6}"

uuid=$(uuidgen | tr -d \'\n\' | tr \'[:upper:]\' \'[:lower:]\')
sagokuURL="http://sagoku.${ENVIRONMENT}.cirrostratus.org/api/docker/${APP_NAME}/deploy"
sagokuTeam="user=${SAGOKU_BUILD_USER}" # e.g. steve.coffman@ithaka.org


curl -sSk --cookie-jar /tmp/cookie -L -F ${sagokuTeam} -F deployId=${uuid} -F image=${IMAGE} ${sagokuURL}