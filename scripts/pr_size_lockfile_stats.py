#!/usr/bin/env python3
"""Summarize lockfile-only changes from GitHub's pull-request files response."""

from __future__ import annotations

import json
import sys
from pathlib import PurePosixPath
from typing import Any


LOCKFILE_NAMES = frozenset(
    {
        ".terraform.lock.hcl",
        "Cargo.lock",
        "Gemfile.lock",
        "Pipfile.lock",
        "bun.lock",
        "bun.lockb",
        "composer.lock",
        "go.sum",
        "npm-shrinkwrap.json",
        "package-lock.json",
        "pnpm-lock.yaml",
        "poetry.lock",
        "uv.lock",
        "yarn.lock",
    }
)


def _flatten_pages(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, list):
        raise ValueError("pull-request files response must be a JSON array")
    if all(isinstance(item, dict) for item in payload):
        return payload
    if all(isinstance(page, list) for page in payload):
        files = [item for page in payload for item in page]
        if all(isinstance(item, dict) for item in files):
            return files
    raise ValueError("pull-request files response has an unexpected shape")


def summarize(payload: Any) -> tuple[int, int, int]:
    additions = 0
    deletions = 0
    files = 0
    for entry in _flatten_pages(payload):
        filename = entry.get("filename")
        added = entry.get("additions")
        deleted = entry.get("deletions")
        if not isinstance(filename, str):
            raise ValueError("file entry is missing a filename")
        if type(added) is not int or added < 0:
            raise ValueError(f"invalid additions for {filename}")
        if type(deleted) is not int or deleted < 0:
            raise ValueError(f"invalid deletions for {filename}")
        if PurePosixPath(filename).name in LOCKFILE_NAMES:
            additions += added
            deletions += deleted
            files += 1
    return additions, deletions, files


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: pr_size_lockfile_stats.py <pull-request-files.json>", file=sys.stderr)
        return 2
    try:
        with open(sys.argv[1], encoding="utf-8") as source:
            additions, deletions, files = summarize(json.load(source))
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"error: {error}", file=sys.stderr)
        return 2
    print(f"lockfile_additions={additions}")
    print(f"lockfile_deletions={deletions}")
    print(f"lockfile_files={files}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
