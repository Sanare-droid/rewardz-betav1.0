import type { RequestHandler } from "express";

function apiKey() {
  return (
    process.env.GOOGLE_VISION_API_KEY ||
    process.env.GOOGLE_CLOUD_VISION_API_KEY ||
    ""
  );
}

export const labelsFromImage: RequestHandler = async (req, res) => {
  try {
    const key = apiKey();
    if (!key)
      return res
        .status(500)
        .json({ error: "Google Vision API key not configured" });
    const { imageBase64, url } = req.body || {};
    if (!imageBase64 && !url)
      return res.status(400).json({ error: "Provide imageBase64 or url" });

    const body = {
      requests: [
        {
          image: imageBase64
            ? { content: imageBase64 }
            : { source: { imageUri: url } },
          features: [{ type: "LABEL_DETECTION", maxResults: 10 }],
        },
      ],
    };

    const r = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );
    const data = await r.json();
    if (!r.ok)
      return res
        .status(r.status)
        .json({ error: data?.error?.message || "Vision API error" });
    const labels: string[] = (data.responses?.[0]?.labelAnnotations || [])
      .map((l: any) => l.description)
      .filter(Boolean);
    res.json({ labels });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Vision request failed" });
  }
};
