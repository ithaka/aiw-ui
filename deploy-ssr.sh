#!/bin/bash
if [ "$1" = "prod" ]; then
    ENVIRONMENT="prod"
else
    ENVIRONMENT="test"
fi
APP_NAME="artstor-ui"
SAGOKU_BUILD_USER="armaan.dandavati@ithaka.org"

uuid=$(uuidgen | tr -d \'\n\' | tr \'[:upper:]\' \'[:lower:]\')
sagokuURL="http://sagoku.${ENVIRONMENT}.cirrostratus.org/api/docker/${APP_NAME}/deploy"
sagokuTeam="user=${SAGOKU_BUILD_USER}"


curl -sSk --cookie-jar /tmp/cookie -L -F ${sagokuTeam} -F deployId=${uuid} -F image=$2 ${sagokuURL}