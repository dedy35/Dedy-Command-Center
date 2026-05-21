import { listPromptTemplates } from "@/config/prompts";
import { DailyLogWorkspace } from "@/components/work/daily-log-workspace";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DailyLogPage() {
  const [tickets, workLogs] = await Promise.all([
    db.ticket.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        ticketNo: true,
        title: true,
      },
      take: 100,
    }),
    db.workLog.findMany({
      orderBy: [{ workDate: "desc" }, { createdAt: "desc" }],
      include: {
        relatedTicket: {
          select: {
            id: true,
            ticketNo: true,
            title: true,
          },
        },
        achievements: {
          orderBy: { createdAt: "desc" },
        },
      },
      take: 100,
    }),
  ]);

  const promptOptions = listPromptTemplates("daily_log").map((prompt) => ({
    key: prompt.key as "daily_log_rewrite_v1" | "cv_bullet_star_v1",
    title: prompt.title,
    description: prompt.description,
  }));

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Daily Work Log</h2>
        <p className="text-sm text-slate-600">
          Fast daily capture and STAR/CV evidence generation flow.
        </p>
      </section>

      <Card className="space-y-3">
        <CardTitle>Daily Log + Achievement Generator</CardTitle>
        <CardDescription>
          Generated CV bullets must not invent metrics. If measurable impact is missing, the system
          will provide explicit impact questions instead.
        </CardDescription>

        <DailyLogWorkspace
          tickets={tickets}
          workLogs={workLogs.map((log) => ({
            id: log.id,
            workDate: log.workDate.toISOString(),
            category: log.category,
            description: log.description,
            impact: log.impact,
            relatedTicket: log.relatedTicket,
            createdAt: log.createdAt.toISOString(),
            achievements: log.achievements.map((achievement) => ({
              id: achievement.id,
              starSituation: achievement.starSituation,
              starTask: achievement.starTask,
              starAction: achievement.starAction,
              starResult: achievement.starResult,
              cvBulletEn: achievement.cvBulletEn,
              cvBulletId: achievement.cvBulletId,
              impactQuestions: achievement.impactQuestions,
              createdAt: achievement.createdAt.toISOString(),
            })),
          }))}
          promptOptions={promptOptions}
        />
      </Card>
    </div>
  );
}
