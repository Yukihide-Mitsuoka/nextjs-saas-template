# Temporary ADR-0024 compatibility entry. Taskfile.yml owns every implementation.
# Remove after local callers and downstream consumers use task directly.

.PHONY: help setup format lint test test-unit test-integration coverage build run \
        security-scan sbom clean doctor

FILE ?=
export FILE

help setup lint test test-unit test-integration coverage build run security-scan sbom clean doctor:
	@task "$@"

format:
	@task "$@" FILE="$${FILE}"
