// api/agent.js
// Backend sécurisé : reçoit une demande de l'app, appelle l'API Anthropic
// avec la clé secrète (jamais exposée au téléphone), renvoie le texte.
// La clé est lue depuis la variable d'environnement ANTHROPIC_API_KEY
// (configurée dans Vercel, jamais écrite dans le code).

export default async function handler(req, res) {
  // Autorise seulement les requêtes POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Clé API non configurée sur le serveur." });
  }

  try {
    const { system, content } = req.body || {};
    if (!system || !content) {
      return res.status(400).json({ error: "Requête incomplète." });
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
        system,
        messages: [{ role: "user", content }],
      }),
    });

    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: data?.error?.message || "Erreur API." });
    }

    const text = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .filter(Boolean)
      .join("\n");

    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: "Erreur serveur." });
  }
}
