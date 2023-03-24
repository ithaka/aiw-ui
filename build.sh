#!/usr/bin/env bash

set -ex

# Ensure dependencies are up to date
yarn install
# Build static app (locally, to be copied into image)
yarn build:ssr:$1
