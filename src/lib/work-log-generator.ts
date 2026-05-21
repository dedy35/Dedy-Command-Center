import type { WorkLog } from "@prisma/client";

type StarDraft = {
  starSituation: string;
  starTask: string;
  starAction: string;
  starResult: string;
  cvBulletEn: string;
  cvBulletId: string;
  impactQuestions: string[];
};

function normalize(text: string | null | undefined) {
  return (text ?? "").trim();
}

function hasQuantMetric(text: string) {
  return /\d/.test(text);
}

export function buildStarCvDraft(workLog: WorkLog): StarDraft {
  const description = normalize(workLog.description);
  const impact = normalize(workLog.impact);
  const baseText = `${description} ${impact}`.trim();

  const metricPresent = hasQuantMetric(baseText);

  const starSituation = `Work date ${workLog.workDate.toISOString().slice(0, 10)} context: ${description}`;
  const starTask =
    "Deliver assigned work item with clear progress visibility and safe handover to stakeholders.";
  const starAction =
    "Captured daily execution details, clarified assumptions, and performed implementation/analysis based on confirmed facts.";

  const starResult = metricPresent
    ? `Observed impact: ${impact || description}`
    : "Result delivered, but measurable impact is not yet confirmed. Quantified validation is still required.";

  const cvBulletEn = metricPresent
    ? `Delivered ${description} and achieved measurable impact (${impact || "see work log evidence"}) while maintaining stakeholder communication discipline.`
    : `Delivered ${description} with structured execution and stakeholder coordination; measurable impact is being validated before final CV submission.`;

  const cvBulletId = metricPresent
    ? `Menyelesaikan ${description} dengan dampak terukur (${impact || "lihat bukti work log"}) sambil menjaga komunikasi stakeholder secara disiplin.`
    : `Menyelesaikan ${description} dengan eksekusi terstruktur dan koordinasi stakeholder; dampak terukur masih dalam proses validasi sebelum finalisasi CV.`;

  const impactQuestions = metricPresent
    ? []
    : [
        "Berapa pengurangan waktu proses (menit/jam) setelah perubahan ini?",
        "Berapa jumlah issue/bug/rework yang berhasil dicegah atau dikurangi?",
        "Apa indikator kualitas atau kecepatan yang paling relevan untuk membuktikan dampak kerja ini?",
      ];

  return {
    starSituation,
    starTask,
    starAction,
    starResult,
    cvBulletEn,
    cvBulletId,
    impactQuestions,
  };
}
