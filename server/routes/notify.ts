import type { RequestHandler } from "express";
import { Resend } from "resend";

export const sendEmail: RequestHandler = async (req, res) => {
  try {
    const key = process.env.RESEND_API_KEY;
    if (!key) return res.status(500).json({ error: "Resend not configured" });
    const { to, subject, html, text } = req.body || {};
    if (!to || !subject || (!html && !text))
      return res.status(400).json({ error: "Missing fields" });
    const resend = new Resend(key);
    const from = process.env.RESEND_FROM || "notifications@rewardz.app";
    const out = await resend.emails.send({
      from,
      to,
      subject,
      html: html || undefined,
      text: text || undefined,
    });
    res.json({ id: out.data?.id || "ok" });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to send" });
  }
};
