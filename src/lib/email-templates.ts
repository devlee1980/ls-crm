const BRAND_COLOR = "#0f172a";
const ACCENT_COLOR = "#3b82f6";

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:24px 32px;">
              <span style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">LS Nexus CRM</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f1f5f9;padding:16px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">
                This is an automated notification from LS Nexus CRM. Do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function badge(text: string): string {
  return `<span style="display:inline-block;padding:2px 10px;border-radius:9999px;background:#e0f2fe;color:#0369a1;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${text}</span>`;
}

function field(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:500;">${value}</td>
  </tr>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${BRAND_COLOR};">${text}</h1>`;
}

function subheading(text: string): string {
  return `<p style="margin:0 0 24px;font-size:14px;color:#64748b;">${text}</p>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

// ─── Pipeline: Deal Created ───────────────────────────────────────────────────

interface DealEmailData {
  id: string;
  title: string;
  stage: string;
  value: number;
  probability: number;
  expectedClose: string | null;
  customer: { name: string } | null;
  assignedRep: { name: string } | null;
}

export function dealCreatedEmail(deal: DealEmailData): { subject: string; html: string } {
  const subject = `New Pipeline Deal: ${deal.title}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ls-nexus.com";
  const dealUrl = `${appUrl}/pipeline`;

  const body = `
    ${heading("New Pipeline Deal Created")}
    ${subheading(`A new deal has been added to the pipeline.`)}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${field("Deal", deal.title)}
      ${field("Stage", badge(deal.stage))}
      ${field("Value", `$${deal.value.toLocaleString()}`)}
      ${field("Probability", `${deal.probability}%`)}
      ${field("Customer", deal.customer?.name ?? "—")}
      ${field("Assigned Rep", deal.assignedRep?.name ?? "—")}
      ${field("Expected Close", deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString() : "—")}
    </table>
    ${divider()}
    <a href="${dealUrl}" style="display:inline-block;padding:10px 20px;background:${ACCENT_COLOR};color:#ffffff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View Pipeline</a>
  `;

  return { subject, html: baseTemplate(subject, body) };
}

// ─── Pipeline: Stage Updated ──────────────────────────────────────────────────

export function dealStageUpdatedEmail(
  deal: DealEmailData,
  previousStage: string
): { subject: string; html: string } {
  const subject = `Pipeline Update: ${deal.title} moved to ${deal.stage}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ls-nexus.com";
  const dealUrl = `${appUrl}/pipeline`;

  const body = `
    ${heading("Pipeline Deal Stage Updated")}
    ${subheading(`A deal has moved to a new stage.`)}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${field("Deal", deal.title)}
      ${field("Previous Stage", badge(previousStage))}
      ${field("New Stage", badge(deal.stage))}
      ${field("Value", `$${deal.value.toLocaleString()}`)}
      ${field("Probability", `${deal.probability}%`)}
      ${field("Customer", deal.customer?.name ?? "—")}
      ${field("Assigned Rep", deal.assignedRep?.name ?? "—")}
      ${field("Expected Close", deal.expectedClose ? new Date(deal.expectedClose).toLocaleDateString() : "—")}
    </table>
    ${divider()}
    <a href="${dealUrl}" style="display:inline-block;padding:10px 20px;background:${ACCENT_COLOR};color:#ffffff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View Pipeline</a>
  `;

  return { subject, html: baseTemplate(subject, body) };
}

// ─── Action Item: Created ─────────────────────────────────────────────────────

interface ActionItemEmailData {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  dueDate: string | null;
  customer: { name: string } | null;
  assignedTo: { name: string } | null;
}

export function actionItemCreatedEmail(item: ActionItemEmailData): { subject: string; html: string } {
  const subject = `New Action Item: ${item.title}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ls-nexus.com";
  const itemUrl = `${appUrl}/action-items`;

  const body = `
    ${heading("New Action Item Created")}
    ${subheading("A new action item has been added.")}
    <table cellpadding="0" cellspacing="0" width="100%">
      ${field("Title", item.title)}
      ${field("Priority", badge(item.priority))}
      ${field("Status", badge(item.status))}
      ${field("Customer", item.customer?.name ?? "—")}
      ${field("Assigned To", item.assignedTo?.name ?? "—")}
      ${field("Due Date", item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—")}
      ${item.description ? field("Description", item.description) : ""}
    </table>
    ${divider()}
    <a href="${itemUrl}" style="display:inline-block;padding:10px 20px;background:${ACCENT_COLOR};color:#ffffff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">View Action Items</a>
  `;

  return { subject, html: baseTemplate(subject, body) };
}

// ─── Action Items: Weekly Digest ──────────────────────────────────────────────

export function actionItemsDigestEmail(items: ActionItemEmailData[]): { subject: string; html: string } {
  const subject = `Weekly Action Items Digest — ${items.length} Open Item${items.length !== 1 ? "s" : ""}`;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ls-nexus.com";
  const itemsUrl = `${appUrl}/action-items`;

  const priorityOrder: Record<string, number> = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...items].sort(
    (a, b) => (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4)
  );

  const rows = sorted
    .map(
      (item) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:10px 8px;font-size:13px;color:#1e293b;font-weight:500;">${item.title}</td>
        <td style="padding:10px 8px;font-size:13px;">${badge(item.priority)}</td>
        <td style="padding:10px 8px;font-size:13px;color:#64748b;">${item.customer?.name ?? "—"}</td>
        <td style="padding:10px 8px;font-size:13px;color:#64748b;">${item.assignedTo?.name ?? "—"}</td>
        <td style="padding:10px 8px;font-size:13px;color:#64748b;">${item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"}</td>
      </tr>`
    )
    .join("");

  const table =
    items.length === 0
      ? `<p style="color:#64748b;font-size:14px;">No open action items this week.</p>`
      : `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #e2e8f0;border-radius:6px;overflow:hidden;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Title</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Priority</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Customer</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Assigned To</th>
              <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Due Date</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>`;

  const body = `
    ${heading(`Weekly Action Items Digest`)}
    ${subheading(`You have ${items.length} open action item${items.length !== 1 ? "s" : ""} as of ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.`)}
    ${table}
    ${divider()}
    <a href="${itemsUrl}" style="display:inline-block;padding:10px 20px;background:${ACCENT_COLOR};color:#ffffff;border-radius:6px;text-decoration:none;font-size:14px;font-weight:600;">Manage Action Items</a>
  `;

  return { subject, html: baseTemplate(subject, body) };
}

// ─── Auth: Password Reset ─────────────────────────────────────────────────────

export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  const subject = "Reset your LS Nexus password";

  const body = `
    ${heading("Reset Your Password")}
    ${subheading("We received a request to reset the password for your LS Nexus account.")}
    <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
      Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
    </p>
    <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:${ACCENT_COLOR};color:#ffffff;border-radius:6px;text-decoration:none;font-size:15px;font-weight:600;">
      Reset Password
    </a>
    ${divider()}
    <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
      If you didn't request a password reset, you can safely ignore this email — your password won't change.<br/>
      If the button above doesn't work, copy and paste this URL into your browser:<br/>
      <span style="color:#3b82f6;word-break:break-all;">${resetUrl}</span>
    </p>
  `;

  return { subject, html: baseTemplate(subject, body) };
}
