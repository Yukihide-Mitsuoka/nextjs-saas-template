export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold">{"{{PROJECT_NAME}}"}</h1>
      <p className="mt-4 text-sm">
        SaaS starter on the ai-dev-foundation base. Replace this page — routing stays a thin shell
        over <code>src/modules/*/interface</code> (ARC-001).
      </p>
    </main>
  );
}
