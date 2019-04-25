#!/bin/bash -e
if [ "$1" = "prod" ]; then
    ENVIRONMENT="prod"
    # Verify on master for prod deploy
    BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [[ "$BRANCH" != "master" ]]; then
    echo '⚠️  Aborting script, must deploy from "master" to Prod!';
    exit 1;
    fi
else
    ENVIRONMENT="test"
fi
GIT_SHA=$(git rev-parse HEAD)
export IMAGE=artifactory.acorn.cirrostratus.org/artstor-air-node:${GIT_SHA:0:8}

# Update docker-compose with image name
rm -f docker-compose.yml temp.yml  
( echo "cat <<EOF >docker-compose.yml";
  cat docker-compose.template.yml;
  echo "EOF";
) >temp.yml
. temp.yml
cat docker-compose.yml
rm -f temp.yml

# Ensure dependencies are up to date
yarn install && npm link @angular/cli
# Build static app (locally, to be copied into image)
yarn build:ssr:${ENVIRONMENT}
# Build docker image
docker build --build-arg SAGOKU_ENV=${ENVIRONMENT} -t ${IMAGE} .

# Push image to Ithaka repository/Artifactory http://artifactory.acorn.cirrostratus.org/
docker push ${IMAGE}