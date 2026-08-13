import importlib.util
import json
import unittest
from pathlib import Path


ROOT = Path(__file__).parents[2]
TEMPLATE_REPOSITORY = "Yukihide-Mitsuoka/nextjs-saas-template"
TEMPLATE_ROOT = ".ai/contracts/templates/yukihide-mitsuoka/nextjs-saas-template/"
TEMPLATE_OVERLAY = ROOT / TEMPLATE_ROOT / "agent-overlay.md"
TEMPLATE_EXPORT = ROOT / TEMPLATE_ROOT / "inheritance-export.json"
MODULE_PATH = ROOT / "scripts/template_inheritance.py"
SPEC = importlib.util.spec_from_file_location("template_inheritance", MODULE_PATH)
inheritance = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(inheritance)

EXPECTED_INPUTS = [
    {
        "layer": "foundation",
        "repository": "Yukihide-Mitsuoka/ai-dev-foundation",
        "path": ".ai/contracts/foundation/agent-entry.md",
    },
    {
        "layer": "template",
        "repository": TEMPLATE_REPOSITORY,
        "path": f"{TEMPLATE_ROOT}agent-overlay.md",
    },
]


class InheritanceExportTest(unittest.TestCase):
    def test_synchronized_foundation_regressions_have_explicit_ownership(self):
        manifest = json.loads(
            (ROOT / ".github/inheritance/manifest.json").read_text(encoding="utf-8")
        )
        ignored = {
            line.strip()
            for line in (ROOT / ".templatesyncignore").read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        }

        for path in (
            "scripts/tests/test_expand_phase_compatibility.py",
            "scripts/tests/test_workflow_dependency_pins.py",
        ):
            with self.subTest(path=path):
                self.assertIn(path, manifest["inherited_paths"])
                self.assertNotIn(path, manifest["protected_paths"])
                self.assertNotIn(path, ignored)

    def test_template_overlay_is_owned_and_exports_only_family_rules(self):
        manifest = json.loads(
            (ROOT / ".github/inheritance/manifest.json").read_text(encoding="utf-8")
        )
        overlay = TEMPLATE_OVERLAY.read_text(encoding="utf-8")

        self.assertIn(TEMPLATE_ROOT, manifest["protected_paths"])
        self.assertNotIn(TEMPLATE_ROOT, manifest["inherited_paths"])
        for marker in (
            "Next.js App Router",
            "PostgreSQL row-level security",
            "Clerk",
            "Stripe",
            "src/modules/",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, overlay)
        self.assertNotIn(f"Repository: `{TEMPLATE_REPOSITORY}`", overlay)
        self.assertNotIn(".ai/project/", overlay)

    def test_bootstrap_export_defines_a_direct_child_contract(self):
        export = inheritance._validate_bootstrap_export(
            f"{TEMPLATE_ROOT}inheritance-export.json",
            json.loads(TEMPLATE_EXPORT.read_text(encoding="utf-8")),
            TEMPLATE_REPOSITORY,
        )

        self.assertEqual(EXPECTED_INPUTS, export["agent_inputs"])
        self.assertIn(TEMPLATE_ROOT, export["inherited_paths"])
        for protected in (
            ".ai/project/",
            ".github/workflows/",
            "README.md",
            "prisma/",
            "src/",
            "tests/",
        ):
            with self.subTest(protected=protected):
                self.assertIn(protected, export["protected_paths"])


if __name__ == "__main__":
    unittest.main()
