import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-slate-600">
          Foundation shell is ready. Next phase will wire capture, data flow, and approval queue.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { title: "System Status", value: "Ready", hint: "App shell and navigation online" },
          { title: "Environment", value: "Configured", hint: "Local env template is available" },
          {
            title: "Code Quality",
            value: "ESLint + Prettier",
            hint: "Formatting and linting baseline set",
          },
          {
            title: "Next Milestone",
            value: "Capture + Core Data",
            hint: "Based on roadmap phase 1",
          },
        ].map((item) => (
          <Card key={item.title} className="space-y-2">
            <p className="text-xs font-medium tracking-[0.14em] text-slate-500 uppercase">
              {item.title}
            </p>
            <p className="text-xl font-semibold tracking-tight">{item.value}</p>
            <CardDescription>{item.hint}</CardDescription>
          </Card>
        ))}
      </section>

      <Card className="space-y-2">
        <CardTitle>Ready For Build Phases</CardTitle>
        <CardDescription>
          This foundation intentionally contains no business modules yet. It provides a stable base
          for the next implementation prompts.
        </CardDescription>
      </Card>
    </div>
  );
}
