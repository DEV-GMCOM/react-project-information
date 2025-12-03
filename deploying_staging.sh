#!/bin/bash

# ====================================================================
# React Staging Build & Deploy Script for GCP VM (Corrected)
# ====================================================================

# --- 설정 변수 ---
LOCAL_PROJECT_PATH="/Users/gmc-mc-001/DEV/WebstormProjects/react-information-test"
LOCAL_BUILD_DIR="$LOCAL_PROJECT_PATH/dist" # '*' 없이 디렉터리 경로만 지정
REMOTE_INSTANCE="ai_gmcom01@instance-20250910-001426"
REMOTE_DEST_PATH="/srv/gmcom/application/www/react-vite-gmcom-information-staging"
ZONE="us-central1-a"

# --- 스크립트 실행 시작 ---
echo "🚀 Staging 배포를 시작합니다..."
echo "--------------------------------------------------------"

# 1. 프로젝트 디렉터리로 이동
# '|| exit'는 cd 명령이 실패하면 스크립트를 즉시 중단시켜 안전성을 높입니다.
cd "$LOCAL_PROJECT_PATH" || exit

# 2. React 프로젝트 빌드
echo "📦 React 프로젝트를 빌드합니다... (npm run build:staging)"
npm run build:staging

# 빌드 성공 여부 확인
if [ $? -ne 0 ]; then
  echo "❌ 오류: React 프로젝트 빌드에 실패했습니다."
  exit 1
fi
echo "✅ 빌드가 성공적으로 완료되었습니다."
echo "--------------------------------------------------------"


# 3. gcloud compute scp 명령어를 사용하여 빌드 결과물 복사
echo "📂 로컬 빌드 경로: $LOCAL_BUILD_DIR"
echo "🖥️  원격 경로: $REMOTE_INSTANCE:$REMOTE_DEST_PATH"
echo "--------------------------------------------------------"

# 👇 [핵심 수정] $LOCAL_BUILD_DIR 경로 자체는 따옴표로 감싸고, /*는 밖으로 빼서 쉘이 확장하도록 함
gcloud compute scp --recurse \
  --zone="$ZONE" \
  "$LOCAL_BUILD_DIR"/* \
  "$REMOTE_INSTANCE:$REMOTE_DEST_PATH"

# scp 명령어 실행 결과 확인
if [ $? -eq 0 ]; then
  echo "✅ 파일 복사가 성공적으로 완료되었습니다."
  echo "🎉 Staging 배포가 완료되었습니다."
else
  echo "❌ 오류: 파일 복사 중 문제가 발생했습니다."
  echo "gcloud 로그를 확인해주세요."
fi


