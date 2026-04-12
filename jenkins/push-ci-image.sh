#!/usr/bin/env bash
# Build and push the CI Docker image used by the Jenkins pipeline.
# Run this once (and again whenever jenkins/Dockerfile.ci changes):
#
#   ./jenkins/push-ci-image.sh
#
set -euo pipefail

IMAGE="expressthat/auth-ci:latest"

docker build -f "$(dirname "$0")/Dockerfile.ci" -t "$IMAGE" "$(dirname "$0")"
docker push "$IMAGE"

echo "Pushed $IMAGE"
