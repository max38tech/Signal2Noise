#!/usr/bin/env bash
# Enable required Google Cloud APIs for the Signal2Noise project.
# Usage:
#   ./scripts/enable_apis.sh <PROJECT_ID>
#
# Example:
#   ./scripts/enable_apis.sh my-gcp-project-123
#
# Notes:
# - Requires gcloud CLI authenticated with sufficient permissions (Project Owner or Service Usage Admin).
# - Optionally set a default region/zone in your environment for other services as needed.
# - This script only enables APIs; it does not create Firebase/Firestore resources.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <PROJECT_ID>"
  exit 1
fi

PROJECT_ID="$1"

echo "Setting active project to: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}" 1>/dev/null

# Required APIs
APIS=(
  "speech.googleapis.com"          # Cloud Speech-to-Text
  "texttospeech.googleapis.com"    # Cloud Text-to-Speech
  "aiplatform.googleapis.com"      # Vertex AI
)

echo "Enabling required APIs..."
for api in "${APIS[@]}"; do
  echo "Enabling: ${api}"
  gcloud services enable "${api}" --project "${PROJECT_ID}"
done

echo "Verifying API enablement..."
gcloud services list --enabled --project "${PROJECT_ID}" | grep -E "speech.googleapis.com|texttospeech.googleapis.com|aiplatform.googleapis.com" || true

echo "All requested APIs processed."