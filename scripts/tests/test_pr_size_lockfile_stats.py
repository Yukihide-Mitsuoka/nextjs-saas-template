import unittest

from scripts.pr_size_lockfile_stats import summarize


class PullRequestLockfileStatsTests(unittest.TestCase):
    def test_sums_recognized_lockfiles_across_paginated_responses(self) -> None:
        payload = [
            [
                {"filename": "package.json", "additions": 4, "deletions": 2},
                {"filename": "pnpm-lock.yaml", "additions": 300, "deletions": 700},
            ],
            [{"filename": "infra/.terraform.lock.hcl", "additions": 8, "deletions": 3}],
        ]

        self.assertEqual(summarize(payload), (308, 703, 2))

    def test_does_not_exclude_similarly_named_source_files(self) -> None:
        payload = [
            {"filename": "docs/pnpm-lock.yaml.md", "additions": 1000, "deletions": 0},
            {"filename": "src/package-lock.json.ts", "additions": 1000, "deletions": 0},
        ]

        self.assertEqual(summarize(payload), (0, 0, 0))

    def test_rejects_malformed_file_statistics(self) -> None:
        with self.assertRaises(ValueError):
            summarize([{"filename": "pnpm-lock.yaml", "additions": "300", "deletions": 0}])


if __name__ == "__main__":
    unittest.main()
