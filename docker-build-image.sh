#!/bin/bash
GIT_SHA=$(git rev-parse HEAD)
docker build -t  artifactory.acorn.cirrostratus.org/artstor-air-node:${GIT_SHA:0:6} .