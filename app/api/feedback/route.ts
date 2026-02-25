import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorized } from "@/lib/api-auth";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const userId = await getAuthenticatedUser();
  if (!userId) return unauthorized();

  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("DISCORD_FEEDBACK_WEBHOOK_URL is not configured");
    return NextResponse.json({ message: "Feedback not configured" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const message = formData.get("message") as string | null;
    const images = formData.getAll("images") as File[];

    if (!message?.trim()) {
      return NextResponse.json({ message: "Message is required" }, { status: 400 });
    }

    const session = await auth();
    const userName = session?.user?.name ?? "Unknown";
    const userEmail = session?.user?.email ?? "—";

    const embed = {
      title: "Bug Report / Feedback",
      description: message.trim(),
      color: 0x6b8e6e,
      fields: [
        { name: "User", value: userName, inline: true },
        { name: "Email", value: userEmail, inline: true },
        { name: "User ID", value: userId, inline: false },
      ],
      timestamp: new Date().toISOString(),
    };

    const discordForm = new FormData();
    discordForm.append("payload_json", JSON.stringify({ embeds: [embed] }));

    const validImages = images.filter((f) => f instanceof File && f.size > 0);
    validImages.slice(0, 3).forEach((file, i) => {
      discordForm.append(`files[${i}]`, file, file.name || `screenshot-${i}.png`);
    });

    const res = await fetch(webhookUrl, {
      method: "POST",
      body: discordForm,
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Discord webhook error:", res.status, text);
      return NextResponse.json({ message: "Failed to send report" }, { status: 500 });
    }

    return NextResponse.json({ message: "Report sent successfully" });
  } catch (error) {
    console.error("Feedback submission error:", error);
    return NextResponse.json({ message: "Failed to send report" }, { status: 500 });
  }
}
