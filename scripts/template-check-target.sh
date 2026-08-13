#!/usr/bin/env bash
# Target-owned invariants that the synchronized foundation check cannot carry.

set -u
cd "$(dirname "$0")/.." || exit 9

errors=0
err() { echo "ERROR: $*" >&2; errors=$((errors + 1)); }

for protected_path in '.github/workflows/**' '.gitignore' 'scripts/template-check-target.sh'; do
  grep -qxF "$protected_path" .templatesyncignore \
    || err ".templatesyncignore: missing target-owned boundary: $protected_path (ADR-0004)"
done

python3 -m unittest discover -s tests/governance -p 'test_*.py' \
  || err "Next.js family contract regression tests failed"

if [ "$errors" -eq 0 ]; then
  echo "doctor: OK — nextjs-saas-template target invariants hold"
else
  echo "doctor: FAILED — $errors target invariant(s) violated" >&2
  exit 1
fi
