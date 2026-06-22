import { getAdmin, roleAtLeast } from "@/lib/auth";
import { renderFeedbackEmail, type FeedbackAudienceLabel } from "@/lib/emails/feedback";

// Standalone preview of a feedback invite. ?audience=participant|organizer|mentor
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AUDIENCES: FeedbackAudienceLabel[] = ["participant", "organizer", "mentor"];

const SAMPLE_NAME: Record<FeedbackAudienceLabel, string> = {
  participant: "Amine Benali",
  organizer: "Lina Haddad",
  mentor: "Yacine Toumi",
};

export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin || !roleAtLeast(admin.role, "super_admin"))
    return new Response("Forbidden", { status: 403 });

  const url = new URL(request.url);
  const param = url.searchParams.get("audience") ?? "participant";
  const audienceLabel = (AUDIENCES.includes(param as FeedbackAudienceLabel)
    ? param
    : "participant") as FeedbackAudienceLabel;

  const { html } = await renderFeedbackEmail({
    audienceLabel,
    recipientName: SAMPLE_NAME[audienceLabel],
    token: "0123456789abcdef01", // sample token (link won't resolve)
  });

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
