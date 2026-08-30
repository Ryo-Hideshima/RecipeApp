#!/usr/bin/env bash
# backend/frontend のイメージをビルドして ECR へ push し、ECS サービスを更新する。
# 前提: infra/ で terraform apply 済み、aws CLI 認証済み、Docker 起動済み。
set -euo pipefail

cd "$(dirname "$0")/.."
TF="terraform -chdir=infra"

REGION="$($TF output -raw region)"
ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
BACKEND_REPO="$($TF output -raw ecr_backend)"
FRONTEND_REPO="$($TF output -raw ecr_frontend)"
API_URL="$($TF output -raw api_url)"
CLUSTER="$($TF output -raw cluster_name)"
TAG="$(git rev-parse --short HEAD)"

echo "==> ECR login"
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$REGISTRY"

echo "==> build + push backend ($TAG)"
docker build -t "${BACKEND_REPO}:${TAG}" -t "${BACKEND_REPO}:latest" ./backend
docker push "${BACKEND_REPO}:${TAG}"
docker push "${BACKEND_REPO}:latest"

echo "==> build + push frontend ($TAG)  NEXT_PUBLIC_API_URL=$API_URL"
docker build --build-arg NEXT_PUBLIC_API_URL="$API_URL" \
  -t "${FRONTEND_REPO}:${TAG}" -t "${FRONTEND_REPO}:latest" ./frontend
docker push "${FRONTEND_REPO}:${TAG}"
docker push "${FRONTEND_REPO}:latest"

echo "==> rolling out ECS services"
aws ecs update-service --cluster "$CLUSTER" --service backend  --force-new-deployment --region "$REGION" >/dev/null
aws ecs update-service --cluster "$CLUSTER" --service frontend --force-new-deployment --region "$REGION" >/dev/null
aws ecs wait services-stable --cluster "$CLUSTER" --services backend frontend --region "$REGION"

echo "==> done -> $($TF output -raw site_url)"
