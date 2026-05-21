export type PromptTemplate = {
  key:
    | "ticket_analysis_ja_v1"
    | "redmine_comment_draft_v1"
    | "teams_notification_v1"
    | "daily_log_rewrite_v1"
    | "cv_bullet_star_v1";
  module: "work" | "daily_log";
  outputType: "analysis" | "draft" | "rewrite";
  title: string;
  description: string;
  approvalRequired: boolean;
};

export const promptTemplateRegistry: PromptTemplate[] = [
  {
    key: "ticket_analysis_ja_v1",
    module: "work",
    outputType: "analysis",
    title: "Ticket Analysis (JA)",
    description:
      "Extract issue, confirmed facts, assumptions, risks, unclear points, and next actions in careful Japanese workplace style.",
    approvalRequired: false,
  },
  {
    key: "redmine_comment_draft_v1",
    module: "work",
    outputType: "draft",
    title: "Redmine Comment Draft",
    description:
      "Generate a safe formal Japanese Redmine comment that does not overclaim and clearly separates facts vs assumptions.",
    approvalRequired: true,
  },
  {
    key: "teams_notification_v1",
    module: "work",
    outputType: "draft",
    title: "Teams Notification",
    description:
      "Generate concise Japanese Teams update with short and detailed variants for internal communication.",
    approvalRequired: true,
  },
  {
    key: "daily_log_rewrite_v1",
    module: "daily_log",
    outputType: "rewrite",
    title: "Daily Log Rewrite",
    description: "Rewrite rough daily notes into professional work-log style text.",
    approvalRequired: false,
  },
  {
    key: "cv_bullet_star_v1",
    module: "daily_log",
    outputType: "draft",
    title: "CV STAR Bullet",
    description:
      "Transform work logs into STAR/CV bullets and impact questions without inventing metrics.",
    approvalRequired: false,
  },
];

export function getPromptTemplateByKey(key: string) {
  return promptTemplateRegistry.find((template) => template.key === key);
}

export function listPromptTemplates(moduleName?: string) {
  if (!moduleName) {
    return promptTemplateRegistry;
  }

  return promptTemplateRegistry.filter((template) => template.module === moduleName);
}
