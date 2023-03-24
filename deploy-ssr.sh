#!/bin/bash

ENVIRONMENT=$1
IMAGE_TAG=$2
COMMiT_SHA=$3
SAGOKU_BUILD_USER=$4

APP_NAME="artstor-ui"

sagokuURL="http://sagoku.${ENVIRONMENT}.cirrostratus.org/api/docker/${APP_NAME}/deploy"
sagokuTeam="user=${SAGOKU_BUILD_USER}"


curl -sSk --cookie-jar /tmp/cookie -L -F ${sagokuTeam} -F deployId=${COMMiT_SHA} -F image=${IMAGE_TAG} ${sagokuURL}