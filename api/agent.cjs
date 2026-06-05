// api/agent.cjs
// Format CommonJS (.cjs) pour eviter tout conflit avec "type":"module" du package.json.
// Backend securise : appelle l'API Anthropic avec la cle secrete cote serveur.

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Methode non autorisee" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Cle API non configuree sur le serveur." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const system = body.system;
    const content = body.content;

    if (!system || !content) {
      return res.status(400).json({ error: "Requete incomplete." });
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: system,
        messages: [{ role: "user", content: content }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      const msg = (data && data.error && data.error.message) || "Erreur API.";
      return res.status(r.status).json({ error: msg });
    }

    const text = (data.content || [])
      .map(function (b) { return b.type === "text" ? b.text : ""; })
      .filter(Boolean)
      .join("\n");

    return res.status(200).json({ text: text });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur: " + (e && e.message ? e.message : "inconnue") });
  }
};
