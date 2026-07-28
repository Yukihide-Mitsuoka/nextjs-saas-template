#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/../.." || exit 9

pass=0
fail=0
foundation_sha="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
valid_body="Foundation-source: https://github.com/Yukihide-Mitsuoka/ai-dev-foundation@${foundation_sha}"

expect_exit() {
  want="$1"
  label="$2"
  additions="$3"
  deletions="$4"
  files="$5"
  author="$6"
  head_repo="$7"
  target_repo="$8"
  head_ref="$9"
  base_ref="${10}"
  body="${11}"

  ADDITIONS="$additions" \
  DELETIONS="$deletions" \
  FILES="$files" \
  PR_AUTHOR="$author" \
  HEAD_REPO="$head_repo" \
  TARGET_REPO="$target_repo" \
  HEAD_REF="$head_ref" \
  BASE_REF="$base_ref" \
  PR_BODY="$body" \
    bash scripts/pr-size-policy.sh >/dev/null 2>&1
  got=$?

  if [ "$got" -eq "$want" ]; then
    pass=$((pass + 1))
  else
    fail=$((fail + 1))
    echo "FAIL: $label — expected exit $want, got $got"
  fi
}

target="Yukihide-Mitsuoka/nextjs-saas-template"

# The approved mechanical foundation import is the only oversized case allowed.
expect_exit 0 "authenticated foundation sync" 4200 200 43 "github-actions[bot]" "$target" "$target" "chore/template_sync_35daa9f" "main" "$valid_body"

# Every predicate is fail-closed for an oversized PR.
expect_exit 1 "human-authored PR" 4200 200 43 "octocat" "$target" "$target" "chore/template_sync_35daa9f" "main" "$valid_body"
expect_exit 1 "fork head repository" 4200 200 43 "github-actions[bot]" "fork/nextjs-saas-template" "$target" "chore/template_sync_35daa9f" "main" "$valid_body"
expect_exit 1 "wrong branch prefix" 4200 200 43 "github-actions[bot]" "$target" "$target" "feature/large-change" "main" "$valid_body"
expect_exit 1 "wrong base branch" 4200 200 43 "github-actions[bot]" "$target" "$target" "chore/template_sync_35daa9f" "develop" "$valid_body"
expect_exit 1 "short source hash" 4200 200 43 "github-actions[bot]" "$target" "$target" "chore/template_sync_35daa9f" "main" "Foundation-source: https://github.com/Yukihide-Mitsuoka/ai-dev-foundation@35daa9f"
expect_exit 1 "wrong source repository" 4200 200 43 "github-actions[bot]" "$target" "$target" "chore/template_sync_35daa9f" "main" "Foundation-source: https://github.com/example/other@${foundation_sha}"

# Existing limits and invalid-input handling remain independent of PR identity.
expect_exit 0 "within hard limit" 700 100 20 "octocat" "fork/repo" "$target" "feature/change" "main" ""
expect_exit 2 "invalid numeric input" "not-a-number" 0 1 "octocat" "$target" "$target" "feature/change" "main" ""

# GR-020 excludes lockfiles: only the remaining hand-authored diff is enforced.
LOCKFILE_ADDITIONS=300 \
LOCKFILE_DELETIONS=700 \
LOCKFILE_FILES=1 \
  expect_exit 0 "lockfile changes excluded" 315 758 3 "octocat" "$target" "$target" "fix/dependencies" "main" ""

echo "pr-size-policy.test.sh: $pass passed, $fail failed"
[ "$fail" -eq 0 ]
