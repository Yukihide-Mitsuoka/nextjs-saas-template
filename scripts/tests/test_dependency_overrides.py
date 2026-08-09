import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class DependencyOverridesTest(unittest.TestCase):
    def test_brace_expansion_override_includes_security_fix(self) -> None:
        package = json.loads((ROOT / "package.json").read_text())
        version = package["pnpm"]["overrides"].get("brace-expansion")

        self.assertIsNotNone(version)
        self.assertGreaterEqual(
            tuple(int(part) for part in version.split(".")),
            (5, 0, 9),
        )

    def test_nanoid_override_includes_security_fixes(self) -> None:
        package = json.loads((ROOT / "package.json").read_text())
        version = package["pnpm"]["overrides"].get("nanoid")

        self.assertIsNotNone(version)
        self.assertGreaterEqual(
            tuple(int(part) for part in version.split(".")),
            (3, 3, 18),
        )

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
