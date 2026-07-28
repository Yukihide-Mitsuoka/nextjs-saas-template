#!/usr/bin/env bash
# Enforce GR-020, with the authenticated foundation-sync exception from ADR-0005.

set -u

for name in ADDITIONS DELETIONS FILES PR_AUTHOR HEAD_REPO TARGET_REPO HEAD_REF BASE_REF PR_BODY; do
  if [ -z "${!name+x}" ]; then
    echo "::error::Missing required PR-size policy input: $name"
    exit 2
  fi
done

LOCKFILE_ADDITIONS="${LOCKFILE_ADDITIONS:-0}"
LOCKFILE_DELETIONS="${LOCKFILE_DELETIONS:-0}"
LOCKFILE_FILES="${LOCKFILE_FILES:-0}"

for name in ADDITIONS DELETIONS FILES LOCKFILE_ADDITIONS LOCKFILE_DELETIONS LOCKFILE_FILES; do
  value="${!name}"
  case "$value" in
    ''|*[!0-9]*)
      echo "::error::Invalid numeric PR-size policy input: $name"
      exit 2
      ;;
  esac
done

if [ "$LOCKFILE_ADDITIONS" -gt "$ADDITIONS" ] \
  || [ "$LOCKFILE_DELETIONS" -gt "$DELETIONS" ] \
  || [ "$LOCKFILE_FILES" -gt "$FILES" ]; then
  echo "::error::Lockfile exclusions exceed aggregate PR statistics"
  exit 2
fi

authored_additions=$((ADDITIONS - LOCKFILE_ADDITIONS))
authored_deletions=$((DELETIONS - LOCKFILE_DELETIONS))
authored_files=$((FILES - LOCKFILE_FILES))
total=$((authored_additions + authored_deletions))
echo "Changed lines excluding lockfiles: $total, files: $authored_files"

is_authenticated_sync=false
if [ "$PR_AUTHOR" = 'github-actions[bot]' ] \
  && [ "$TARGET_REPO" = 'Yukihide-Mitsuoka/nextjs-saas-template' ] \
  && [ "$HEAD_REPO" = "$TARGET_REPO" ] \
  && [[ "$HEAD_REF" =~ ^chore/template_sync_[0-9a-f]{7,40}$ ]] \
  && [ "$BASE_REF" = 'main' ] \
  && grep -Eq '^Foundation-source: https://github\.com/Yukihide-Mitsuoka/ai-dev-foundation@[0-9a-f]{40}$' <<<"$PR_BODY"; then
  is_authenticated_sync=true
fi

if [ "$total" -gt 800 ] || [ "$authored_files" -gt 20 ]; then
  if [ "$is_authenticated_sync" = true ]; then
    echo "::warning::Authenticated mechanical foundation sync exceeds the GR-020 hard limit; all other checks and human review remain required (ADR-0005)."
    exit 0
  fi

  echo "::error::PR exceeds hard size limit (GR-020). Split it (soft limit 400 lines/10 files, hard 800/20)."
  exit 1
fi

if [ "$total" -gt 400 ] || [ "$authored_files" -gt 10 ]; then
  echo "::warning::PR exceeds the GR-020 soft limit — must be justified in the description (mechanical change?)."
fi
