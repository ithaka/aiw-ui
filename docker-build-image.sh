#!/bin/bash
GIT_SHA=$(git rev-parse HEAD)
export IMAGE=artifactory.acorn.cirrostratus.org/artstor-air-node:${GIT_SHA:0:8}

# Update docker-compose with version
rm -f docker-compose.yml temp.yml  
( echo "cat <<EOF >docker-compose.yml";
  cat docker-compose.template.yml;
  echo "EOF";
) >temp.yml
. temp.yml
cat docker-compose.yml
rm -f temp.yml

# Build docker image
docker build -t ${IMAGE} .

# Push image to Ithaka repository
docker push ${IMAGE}