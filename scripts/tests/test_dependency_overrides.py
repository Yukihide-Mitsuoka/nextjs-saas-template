import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class DependencyOverridesTest(unittest.TestCase):
    def test_postcss_override_includes_security_fix(self) -> None:
        package = json.loads((ROOT / "package.json").read_text())
        version = package["pnpm"]["overrides"].get("postcss")

        self.assertIsNotNone(version)
        self.assertGreaterEqual(
            tuple(int(part) for part in version.split(".")),
            (8, 5, 10),
        )


if __name__ == "__main__":
    unittest.main()
