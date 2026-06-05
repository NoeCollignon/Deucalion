import React, { useState, useRef, useEffect } from "react";
import {
  Heart, User, ClipboardList, FileText, CheckCircle2, Share2,
  CalendarClock, Stethoscope, ShieldAlert, ChevronRight, ChevronLeft,
  Loader2, AlertTriangle, Copy, Check, Sparkles, Lock, ArrowRight,
  Plus, X, ShieldCheck, Activity
} from "lucide-react";

/* ============================================================
   PreConsult IA — POC
   Architecture simulée :
   App mobile (ce composant) → "backend API" (fonction callAgent)
   → agents IA spécialisés (prompts système distincts) → retour résumé
   Contraintes : pas de diagnostic, pas de traitement recommandé,
   filtrage des données nominatives avant tout envoi à l'IA,
   validation patient obligatoire, données fictives.
   ============================================================ */

/* ---------- Couche "backend" : appel générique aux agents ----------
   On appelle NOTRE backend (/api/agent), pas l'API Anthropic directement.
   La clé API reste secrète côté serveur (variable d'environnement Vercel)
   et n'est jamais présente dans l'app installée sur le téléphone. */
async function callAgent(systemPrompt, userContent, expectJson = false) {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, content: userContent }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Erreur agent");
  }
  let text = data.text || "";
  if (expectJson) {
    text = text.replace(/```json|```/g, "").trim();
    return JSON.parse(text);
  }
  return text;
}

/* ---------- Garde-fou : retire les données nominatives ---------- */
function sanitize(text) {
  if (!text) return text;
  return text
    .replace(/\b(0|\+33)\s?[1-9](?:[\s.-]?\d{2}){4}\b/g, "[téléphone masqué]")
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[email masqué]");
}

/* Construit la charge utile envoyée à l'IA : uniquement données médicales,
   jamais nom/prénom/téléphone/adresse. */
function buildClinicalPayload(answers, lists) {
  const clinical = {
    age: answers.age || "non précisé",
    sexe: answers.sexe || "non précisé",
    motif: sanitize(answers.motif),
    symptomes: sanitize(answers.symptomes),
    depuis: answers.depuis,
    intensite: answers.intensite,
    facteurs: sanitize(answers.facteurs),
    traitements: lists.traitements.map(sanitize),
    antecedents: lists.antecedents.map(sanitize),
    allergies: lists.allergies.map(sanitize),
  };
  return JSON.stringify(clinical, null, 2);
}

/* ====================== Agents (prompts) ====================== */
const PROMPTS = {
  questionnaire: `Tu es l'Agent Questionnaire d'une app de PRÉPARATION de consultation (pas de diagnostic).
À partir des réponses partielles d'un patient, génère 1 à 3 questions de précision courtes, bienveillantes et utiles pour le médecin.
INTERDIT : poser un diagnostic, suggérer une cause, recommander un traitement.
Réponds UNIQUEMENT en JSON : {"questions": ["...", "..."]} sans texte autour.`,

  resume: `Tu es l'Agent Résumé d'une app de préparation de consultation.
Transforme les données cliniques en un résumé pré-consultation clair et structuré, destiné au médecin.
Structure en sections : Motif, Symptômes (avec durée/intensité), Traitements en cours, Antécédents, Allergies, Points à explorer.
INTERDIT ABSOLU : poser un diagnostic, nommer une maladie probable, recommander/ajuster un traitement.
Reste factuel, neutre, concis. N'invente aucune donnée. N'inclus jamais de nom, téléphone ou adresse.
Réponds en texte structuré simple (titres en MAJUSCULES suivis de tirets).`,

  verification: `Tu es l'Agent Vérification d'une app de préparation de consultation.
Analyse les données cliniques et repère : (a) informations manquantes importantes, (b) incohérences ou éléments incertains.
INTERDIT : diagnostic, recommandation de traitement.
Réponds UNIQUEMENT en JSON : {"manquant": ["..."], "aVerifier": ["..."]} sans texte autour. Listes vides si rien.`,

  rendezvous: `Tu es l'Agent Rendez-vous d'une app de préparation de consultation.
Rédige un court message prêt à être envoyé au secrétariat médical pour demander un rendez-vous, en t'appuyant sur le motif (sans détails sensibles superflus).
INTERDIT : diagnostic, urgence médicale auto-évaluée, recommandation de traitement.
Ton : poli, bref, professionnel. Pas de nom (le patient l'ajoutera). Réponds uniquement avec le message.`,
};

/* ====================== Données fictives POC ====================== */
const DEMO = {
  profil: { initiales: "M. D.", age: "34", sexe: "Femme" },
  motif: "Maux de tête récurrents depuis deux semaines",
  symptomes: "Douleur pulsatile côté droit, sensibilité à la lumière, parfois nausées",
  depuis: "2 semaines",
  intensite: "6",
  facteurs: "Plus fort en fin de journée et après le travail sur écran",
  traitements: ["Paracétamol 1g si douleur"],
  antecedents: ["Migraines occasionnelles depuis l'adolescence"],
  allergies: ["Pénicilline"],
};

/* ====================== Styles ====================== */
const C = {
  bg: "#F4F7F6",
  card: "#FFFFFF",
  ink: "#1B2A2F",
  sub: "#5C6B70",
  line: "#E2E9E8",
  brand: "#0E7C66",
  brandSoft: "#E4F2EE",
  brandInk: "#0A5A4A",
  warn: "#B45309",
  warnSoft: "#FEF3E2",
};

const font = `'Fraunces', Georgia, serif`;
const sans = `'Outfit', -apple-system, BlinkMacSystemFont, sans-serif`;

/* ====================== UI helpers ====================== */
function Disclaimer({ compact }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      background: C.warnSoft, border: `1px solid #F6D9A8`,
      borderRadius: 14, padding: compact ? "10px 12px" : "12px 14px",
    }}>
      <ShieldAlert size={compact ? 16 : 18} color={C.warn} style={{ flexShrink: 0, marginTop: 1 }} />
      <p style={{ margin: 0, fontSize: compact ? 11.5 : 12.5, lineHeight: 1.45, color: "#7A4A12", fontFamily: sans }}>
        Cet outil <strong>ne pose aucun diagnostic</strong> et <strong>ne recommande aucun traitement</strong>.
        Il prépare votre consultation. En cas d'urgence, appelez le 15 (ou le 112).
      </p>
    </div>
  );
}

function Btn({ children, onClick, disabled, variant = "primary", icon: Icon, full }) {
  const styles = {
    primary: { background: C.brand, color: "#fff", border: "none" },
    ghost: { background: "transparent", color: C.brandInk, border: `1.5px solid ${C.line}` },
    soft: { background: C.brandSoft, color: C.brandInk, border: "none" },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        ...styles[variant], opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: "13px 18px", borderRadius: 14, fontWeight: 600,
        fontSize: 15, fontFamily: sans, display: "inline-flex",
        alignItems: "center", justifyContent: "center", gap: 8,
        width: full ? "100%" : "auto", transition: "transform .12s, filter .2s",
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.98)")}
      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {Icon && <Icon size={18} />}{children}
    </button>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", textarea, hint }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 6, fontFamily: sans }}>{label}</span>
      {hint && <span style={{ display: "block", fontSize: 11.5, color: C.sub, marginBottom: 6, fontFamily: sans }}>{hint}</span>}
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3}
          style={inputStyle} />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          style={inputStyle} />
      )}
    </label>
  );
}
const inputStyle = {
  width: "100%", boxSizing: "border-box", padding: "12px 14px",
  borderRadius: 12, border: `1.5px solid ${C.line}`, fontSize: 15,
  fontFamily: sans, color: C.ink, background: "#FBFDFC", outline: "none",
  resize: "vertical",
};

function ListEditor({ label, items, setItems, placeholder, color }) {
  const [draft, setDraft] = useState("");
  const add = () => { if (draft.trim()) { setItems([...items, draft.trim()]); setDraft(""); } };
  return (
    <div style={{ marginBottom: 18 }}>
      <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 8, fontFamily: sans }}>{label}</span>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
        {items.map((it, i) => (
          <span key={i} style={{
            display: "inline-flex", alignItems: "center", gap: 6, background: color || C.brandSoft,
            color: C.brandInk, padding: "6px 10px", borderRadius: 20, fontSize: 13, fontFamily: sans, fontWeight: 500,
          }}>
            {it}
            <X size={14} style={{ cursor: "pointer" }} onClick={() => setItems(items.filter((_, j) => j !== i))} />
          </span>
        ))}
        {items.length === 0 && <span style={{ fontSize: 12.5, color: C.sub, fontFamily: sans }}>Aucun élément.</span>}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder}
          onKeyDown={(e) => e.key === "Enter" && add()} style={{ ...inputStyle, flex: 1 }} />
        <Btn variant="soft" icon={Plus} onClick={add}>Ajouter</Btn>
      </div>
    </div>
  );
}

/* ====================== App ====================== */
export default function PreConsultIA() {
  const [screen, setScreen] = useState("home"); // home | profil | quest | summary | doctor
  const [step, setStep] = useState(0);

  const [profil, setProfil] = useState({ initiales: "", age: "", sexe: "" });
  const [answers, setAnswers] = useState({ motif: "", symptomes: "", depuis: "", intensite: "5", facteurs: "" });
  const [traitements, setTraitements] = useState([]);
  const [antecedents, setAntecedents] = useState([]);
  const [allergies, setAllergies] = useState([]);

  const [aiQuestions, setAiQuestions] = useState([]);
  const [aiAnswers, setAiAnswers] = useState({});
  const [loadingQ, setLoadingQ] = useState(false);

  const [summary, setSummary] = useState("");
  const [verif, setVerif] = useState(null);
  const [rdvMsg, setRdvMsg] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [validated, setValidated] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");

  function loadDemo() {
    setProfil({ initiales: DEMO.profil.initiales, age: DEMO.profil.age, sexe: DEMO.profil.sexe });
    setAnswers({ motif: DEMO.motif, symptomes: DEMO.symptomes, depuis: DEMO.depuis, intensite: DEMO.intensite, facteurs: DEMO.facteurs });
    setTraitements(DEMO.traitements); setAntecedents(DEMO.antecedents); setAllergies(DEMO.allergies);
  }

  /* Agent Questionnaire */
  async function askPrecisions() {
    setLoadingQ(true); setErr("");
    try {
      const payload = buildClinicalPayload(answers, { traitements, antecedents, allergies });
      const res = await callAgent(PROMPTS.questionnaire, payload, true);
      setAiQuestions(res.questions || []);
    } catch (e) { setErr("L'agent questionnaire est indisponible. Vous pouvez continuer sans précisions."); }
    setLoadingQ(false);
  }

  /* Agents Résumé + Vérification + Rendez-vous (orchestration "backend") */
  async function generateSummary() {
    setLoadingSummary(true); setErr(""); setValidated(false);
    try {
      const extra = Object.entries(aiAnswers)
        .filter(([, v]) => v && v.trim())
        .map(([q, v]) => `Q: ${aiQuestions[q]} R: ${sanitize(v)}`).join("\n");
      const payload = buildClinicalPayload(answers, { traitements, antecedents, allergies })
        + (extra ? `\n\nPrécisions complémentaires:\n${extra}` : "");

      const [s, v, r] = await Promise.all([
        callAgent(PROMPTS.resume, payload),
        callAgent(PROMPTS.verification, payload, true),
        callAgent(PROMPTS.rendezvous, `Motif: ${sanitize(answers.motif)}`),
      ]);
      setSummary(s); setVerif(v); setRdvMsg(r);
    } catch (e) { setErr("Une erreur est survenue lors de la génération. Réessayez."); }
    setLoadingSummary(false);
  }

  function copySummary() {
    const text = `RÉSUMÉ PRÉ-CONSULTATION (préparé par le patient, validé)\n\n${summary}`;
    navigator.clipboard?.writeText(text);
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  }

  const profilOk = profil.age && profil.sexe;
  const questOk = answers.motif.trim() && answers.symptomes.trim();

  return (
    <div style={{ fontFamily: sans, background: C.bg, minHeight: "100vh", color: C.ink }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Outfit:wght@400;500;600;700&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { width: 0; }`}</style>

      <div style={{ maxWidth: 430, margin: "0 auto", minHeight: "100vh", background: C.bg, position: "relative", paddingBottom: 90 }}>

        {/* ---------- Header ---------- */}
        <header style={{
          padding: "18px 20px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "rgba(244,247,246,0.9)", backdropFilter: "blur(10px)", zIndex: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: C.brand, display: "grid", placeItems: "center" }}>
              <Heart size={20} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{ fontFamily: font, fontWeight: 700, fontSize: 18, lineHeight: 1, letterSpacing: "-0.02em" }}>PreConsult IA</div>
              <div style={{ fontSize: 10.5, color: C.sub, marginTop: 2 }}>Préparez votre consultation</div>
            </div>
          </div>
          <div title="Données protégées" style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, color: C.brandInk, background: C.brandSoft, padding: "5px 9px", borderRadius: 20, fontWeight: 600 }}>
            <Lock size={12} /> Privé
          </div>
        </header>

        <main style={{ padding: "4px 20px 20px" }}>
          {/* ============ ACCUEIL ============ */}
          {screen === "home" && (
            <Home setScreen={setScreen} loadDemo={loadDemo} />
          )}

          {/* ============ PROFIL ============ */}
          {screen === "profil" && (
            <section>
              <ScreenTitle icon={User} title="Profil patient" sub="Données minimales. Vos nom et coordonnées ne sont jamais envoyés à l'IA." />
              <div style={cardStyle}>
                <Field label="Initiales (facultatif)" value={profil.initiales} onChange={(v) => setProfil({ ...profil, initiales: v })} placeholder="Ex. M. D." hint="Restez anonyme : pas de nom complet." />
                <Field label="Âge" type="number" value={profil.age} onChange={(v) => setProfil({ ...profil, age: v })} placeholder="34" />
                <div style={{ marginBottom: 4 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Sexe</span>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["Femme", "Homme", "Autre"].map((s) => (
                      <button key={s} onClick={() => setProfil({ ...profil, sexe: s })}
                        style={{
                          flex: 1, padding: "11px", borderRadius: 12, fontFamily: sans, fontWeight: 600, fontSize: 14,
                          cursor: "pointer", border: `1.5px solid ${profil.sexe === s ? C.brand : C.line}`,
                          background: profil.sexe === s ? C.brandSoft : "#fff", color: profil.sexe === s ? C.brandInk : C.sub,
                        }}>{s}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Btn variant="ghost" icon={ChevronLeft} onClick={() => setScreen("home")}>Retour</Btn>
                <Btn full disabled={!profilOk} icon={ChevronRight} onClick={() => { setScreen("quest"); setStep(0); }}>Continuer</Btn>
              </div>
            </section>
          )}

          {/* ============ QUESTIONNAIRE ============ */}
          {screen === "quest" && (
            <section>
              <ScreenTitle icon={ClipboardList} title="Questionnaire guidé" sub="L'agent questionnaire vous aide à préciser. Aucune réponse n'est un diagnostic." />
              <ProgressDots count={4} active={step} />

              <div style={cardStyle}>
                {step === 0 && (
                  <>
                    <Field label="Motif de consultation" textarea value={answers.motif} onChange={(v) => setAnswers({ ...answers, motif: v })} placeholder="Pourquoi consultez-vous ?" />
                    <Field label="Symptômes ressentis" textarea value={answers.symptomes} onChange={(v) => setAnswers({ ...answers, symptomes: v })} placeholder="Décrivez ce que vous ressentez" />
                    <Field label="Depuis quand ?" value={answers.depuis} onChange={(v) => setAnswers({ ...answers, depuis: v })} placeholder="Ex. 2 semaines" />
                    <div style={{ marginTop: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>Intensité ressentie : <strong style={{ color: C.brand }}>{answers.intensite}/10</strong></span>
                      <input type="range" min="0" max="10" value={answers.intensite} onChange={(e) => setAnswers({ ...answers, intensite: e.target.value })}
                        style={{ width: "100%", marginTop: 8, accentColor: C.brand }} />
                    </div>
                    <Field label="Facteurs aggravants / déclencheurs (facultatif)" textarea value={answers.facteurs} onChange={(v) => setAnswers({ ...answers, facteurs: v })} placeholder="Ex. après un effort, le soir…" />
                  </>
                )}
                {step === 1 && (
                  <>
                    <ListEditor label="Traitements en cours" items={traitements} setItems={setTraitements} placeholder="Ex. Paracétamol 1g" />
                    <ListEditor label="Antécédents médicaux" items={antecedents} setItems={setAntecedents} placeholder="Ex. Asthme" />
                    <ListEditor label="Allergies connues" items={allergies} setItems={setAllergies} placeholder="Ex. Pénicilline" color="#FDE7E7" />
                  </>
                )}
                {step === 2 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <Sparkles size={18} color={C.brand} />
                      <strong style={{ fontSize: 15 }}>Précisions suggérées par l'IA</strong>
                    </div>
                    {aiQuestions.length === 0 && !loadingQ && (
                      <>
                        <p style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5, marginTop: 0 }}>
                          L'agent questionnaire peut proposer quelques questions de précision pour mieux préparer votre médecin.
                        </p>
                        <Btn full icon={Sparkles} onClick={askPrecisions}>Demander des précisions</Btn>
                      </>
                    )}
                    {loadingQ && <Loading label="L'agent prépare ses questions…" />}
                    {aiQuestions.map((q, i) => (
                      <div key={i} style={{ marginTop: 14 }}>
                        <span style={{ fontSize: 13.5, fontWeight: 600, display: "block", marginBottom: 6 }}>{q}</span>
                        <textarea rows={2} value={aiAnswers[i] || ""} onChange={(e) => setAiAnswers({ ...aiAnswers, [i]: e.target.value })}
                          placeholder="Votre réponse (facultatif)" style={inputStyle} />
                      </div>
                    ))}
                  </div>
                )}
                {step === 3 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <ShieldCheck size={18} color={C.brand} />
                      <strong style={{ fontSize: 15 }}>Vérification avant résumé</strong>
                    </div>
                    <Recap label="Profil" value={`${profil.initiales || "—"} · ${profil.age} ans · ${profil.sexe}`} />
                    <Recap label="Motif" value={answers.motif || "—"} />
                    <Recap label="Symptômes" value={answers.symptomes || "—"} />
                    <Recap label="Durée / intensité" value={`${answers.depuis || "—"} · ${answers.intensite}/10`} />
                    <Recap label="Traitements" value={traitements.join(", ") || "—"} />
                    <Recap label="Antécédents" value={antecedents.join(", ") || "—"} />
                    <Recap label="Allergies" value={allergies.join(", ") || "—"} />
                    <div style={{ marginTop: 12 }}>
                      <Disclaimer compact />
                    </div>
                  </div>
                )}
              </div>

              {err && <ErrBox text={err} />}

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Btn variant="ghost" icon={ChevronLeft} onClick={() => step === 0 ? setScreen("profil") : setStep(step - 1)}>
                  {step === 0 ? "Profil" : "Précédent"}
                </Btn>
                {step < 3 ? (
                  <Btn full disabled={step === 0 && !questOk} icon={ChevronRight} onClick={() => setStep(step + 1)}>Suivant</Btn>
                ) : (
                  <Btn full icon={FileText} disabled={loadingSummary} onClick={() => { setScreen("summary"); generateSummary(); }}>
                    {loadingSummary ? "Génération…" : "Générer le résumé"}
                  </Btn>
                )}
              </div>
            </section>
          )}

          {/* ============ RÉSUMÉ ============ */}
          {screen === "summary" && (
            <section>
              <ScreenTitle icon={FileText} title="Résumé pré-consultation" sub="Relisez, puis validez avant toute transmission." />
              {loadingSummary && <div style={cardStyle}><Loading label="Les agents Résumé, Vérification et Rendez-vous travaillent…" /></div>}

              {!loadingSummary && summary && (
                <>
                  {/* Agent Vérification */}
                  {verif && (verif.manquant?.length > 0 || verif.aVerifier?.length > 0) && (
                    <div style={{ ...cardStyle, background: C.warnSoft, border: "1px solid #F6D9A8", marginBottom: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <AlertTriangle size={16} color={C.warn} />
                        <strong style={{ fontSize: 14, color: "#7A4A12" }}>L'agent vérification a repéré des points</strong>
                      </div>
                      {verif.manquant?.map((m, i) => <PointLine key={"m" + i} text={m} tag="Manquant" />)}
                      {verif.aVerifier?.map((m, i) => <PointLine key={"v" + i} text={m} tag="À vérifier" />)}
                    </div>
                  )}

                  {/* Résumé */}
                  <div style={cardStyle}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <Activity size={16} color={C.brand} />
                      <strong style={{ fontSize: 14 }}>Pour votre médecin</strong>
                    </div>
                    <pre style={{
                      whiteSpace: "pre-wrap", fontFamily: sans, fontSize: 13.5, lineHeight: 1.6,
                      color: C.ink, margin: 0,
                    }}>{summary}</pre>
                  </div>

                  <div style={{ margin: "14px 0" }}><Disclaimer compact /></div>

                  {/* Validation patient */}
                  {!validated ? (
                    <div style={{ ...cardStyle, border: `1.5px solid ${C.brand}` }}>
                      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", cursor: "pointer" }}>
                        <input type="checkbox" onChange={(e) => setValidated(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18, accentColor: C.brand }} />
                        <span style={{ fontSize: 13.5, lineHeight: 1.5 }}>
                          J'ai relu ce résumé, il reflète ma situation et <strong>j'autorise sa transmission</strong> à mon médecin.
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div style={{ ...cardStyle, background: C.brandSoft, border: "none", display: "flex", alignItems: "center", gap: 10 }}>
                      <CheckCircle2 size={20} color={C.brand} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: C.brandInk }}>Résumé validé par le patient</span>
                    </div>
                  )}

                  {/* Actions post-validation */}
                  {validated && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                        <Btn full variant="soft" icon={copied ? Check : Copy} onClick={copySummary}>
                          {copied ? "Copié !" : "Copier"}
                        </Btn>
                        <Btn full variant="soft" icon={Share2} onClick={() => window.print()}>Exporter / PDF</Btn>
                      </div>

                      {/* Agent Rendez-vous */}
                      <div style={cardStyle}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <CalendarClock size={16} color={C.brand} />
                          <strong style={{ fontSize: 14 }}>Message de prise de rendez-vous</strong>
                        </div>
                        <pre style={{ whiteSpace: "pre-wrap", fontFamily: sans, fontSize: 13, lineHeight: 1.55, color: C.sub, margin: "0 0 12px", background: "#FBFDFC", padding: 12, borderRadius: 10, border: `1px solid ${C.line}` }}>{rdvMsg}</pre>
                        <Btn full icon={ArrowRight} onClick={() => {
                          navigator.clipboard?.writeText(rdvMsg);
                          window.open("https://www.doctolib.fr", "_blank", "noopener,noreferrer");
                        }}>
                          Prendre rendez-vous sur Doctolib
                        </Btn>
                        <p style={{ fontSize: 11, color: C.sub, margin: "8px 0 0", lineHeight: 1.4, textAlign: "center" }}>
                          Le message ci-dessus est copié automatiquement : collez-le lors de votre prise de rendez-vous.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {err && <ErrBox text={err} />}

              <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                <Btn variant="ghost" icon={ChevronLeft} onClick={() => setScreen("quest")}>Modifier</Btn>
                <Btn full variant="ghost" icon={Stethoscope} onClick={() => setScreen("doctor")}>Vue médecin</Btn>
              </div>
            </section>
          )}

          {/* ============ INTERFACE MÉDECIN ============ */}
          {screen === "doctor" && (
            <section>
              <ScreenTitle icon={Stethoscope} title="Espace médecin" sub="Consultation des résumés validés par les patients." />
              <div style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: C.sub }}>Résumés reçus</span>
                  <span style={{ fontSize: 11, background: C.brandSoft, color: C.brandInk, padding: "3px 9px", borderRadius: 20, fontWeight: 600 }}>
                    {validated && summary ? "1" : "0"} validé(s)
                  </span>
                </div>
                {validated && summary ? (
                  <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <strong style={{ fontSize: 14 }}>{profil.initiales || "Patient anonyme"} · {profil.age} ans · {profil.sexe}</strong>
                      <span style={{ fontSize: 11, color: C.brand, display: "flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={13} /> validé</span>
                    </div>
                    <pre style={{ whiteSpace: "pre-wrap", fontFamily: sans, fontSize: 12.5, lineHeight: 1.55, color: C.ink, margin: 0 }}>{summary}</pre>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "30px 10px", color: C.sub }}>
                    <FileText size={32} color={C.line} style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 13.5, margin: 0 }}>Aucun résumé validé pour le moment.</p>
                  </div>
                )}
                <p style={{ fontSize: 11, color: C.sub, marginTop: 14, lineHeight: 1.5 }}>
                  <Lock size={11} style={{ verticalAlign: "-1px" }} /> POC : données fictives, non nominatives, non persistées.
                </p>
              </div>
              <div style={{ marginTop: 18 }}>
                <Btn full variant="ghost" icon={ChevronLeft} onClick={() => setScreen(summary ? "summary" : "home")}>Retour</Btn>
              </div>
            </section>
          )}
        </main>

        {/* ---------- Bottom nav ---------- */}
        <nav style={{
          position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430,
          background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.line}`,
          display: "flex", justifyContent: "space-around", padding: "10px 0 14px",
        }}>
          {[
            { id: "home", icon: Heart, label: "Accueil" },
            { id: "profil", icon: User, label: "Profil" },
            { id: "quest", icon: ClipboardList, label: "Questionnaire" },
            { id: "summary", icon: FileText, label: "Résumé" },
            { id: "doctor", icon: Stethoscope, label: "Médecin" },
          ].map((t) => (
            <button key={t.id} onClick={() => setScreen(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 3, color: screen === t.id ? C.brand : C.sub, fontFamily: sans,
              }}>
              <t.icon size={21} fill={screen === t.id && t.id === "home" ? C.brand : "none"} />
              <span style={{ fontSize: 9.5, fontWeight: screen === t.id ? 700 : 500 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/* ====================== Sous-composants ====================== */
const cardStyle = { background: C.card, borderRadius: 18, padding: 18, border: `1px solid ${C.line}`, boxShadow: "0 1px 3px rgba(20,40,40,0.04)" };

function ScreenTitle({ icon: Icon, title, sub }) {
  return (
    <div style={{ margin: "8px 0 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 5 }}>
        <Icon size={22} color={C.brand} />
        <h1 style={{ fontFamily: font, fontSize: 23, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{title}</h1>
      </div>
      <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.5 }}>{sub}</p>
    </div>
  );
}

function Home({ setScreen, loadDemo }) {
  const feats = [
    { icon: ClipboardList, t: "Questionnaire guidé", d: "Des questions claires, étape par étape." },
    { icon: Sparkles, t: "4 agents IA", d: "Questions, résumé, vérification, rendez-vous." },
    { icon: ShieldCheck, t: "Vous validez tout", d: "Rien n'est transmis sans votre accord." },
    { icon: Lock, t: "Confidentiel", d: "Aucune donnée nominative envoyée à l'IA." },
  ];
  return (
    <section>
      <div style={{
        background: `linear-gradient(155deg, ${C.brand}, ${C.brandInk})`, borderRadius: 22, padding: "26px 22px",
        color: "#fff", marginBottom: 18, position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <Sparkles size={24} style={{ marginBottom: 12, opacity: 0.9 }} />
        <h1 style={{ fontFamily: font, fontSize: 26, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
          Arrivez préparé·e<br />à votre consultation
        </h1>
        <p style={{ fontSize: 14, opacity: 0.92, margin: "0 0 18px", lineHeight: 1.5 }}>
          Répondez à quelques questions. L'IA prépare un résumé clair pour votre médecin. Sans diagnostic, en toute confidentialité.
        </p>
        <Btn variant="soft" icon={ArrowRight} onClick={() => setScreen("profil")}>Commencer</Btn>
      </div>

      <div style={{ marginBottom: 16 }}><Disclaimer /></div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {feats.map((f, i) => (
          <div key={i} style={{ ...cardStyle, padding: 14 }}>
            <f.icon size={20} color={C.brand} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 3 }}>{f.t}</div>
            <div style={{ fontSize: 11.5, color: C.sub, lineHeight: 1.4 }}>{f.d}</div>
          </div>
        ))}
      </div>

      <Btn full variant="ghost" icon={Sparkles} onClick={() => { loadDemo(); setScreen("quest"); }}>
        Essayer avec un exemple fictif
      </Btn>
    </section>
  );
}

function ProgressDots({ count, active }) {
  const labels = ["Symptômes", "Antécédents", "Précisions IA", "Vérification"];
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= active ? C.brand : C.line, transition: "background .3s" }} />
        ))}
      </div>
      <span style={{ fontSize: 12, color: C.sub, fontWeight: 600 }}>Étape {active + 1}/{count} · {labels[active]}</span>
    </div>
  );
}

function Recap({ label, value }) {
  return (
    <div style={{ padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
      <div style={{ fontSize: 11, color: C.sub, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 13.5, color: C.ink }}>{value}</div>
    </div>
  );
}

function PointLine({ text, tag }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6 }}>
      <span style={{ fontSize: 9.5, fontWeight: 700, background: "#fff", color: C.warn, padding: "2px 7px", borderRadius: 20, flexShrink: 0, marginTop: 1 }}>{tag}</span>
      <span style={{ fontSize: 12.5, color: "#7A4A12", lineHeight: 1.4 }}>{text}</span>
    </div>
  );
}

function Loading({ label }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "26px 0", color: C.sub }}>
      <Loader2 size={28} color={C.brand} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <span style={{ fontSize: 13, textAlign: "center", maxWidth: 240, lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

function ErrBox({ text }) {
  return (
    <div style={{ marginTop: 14, background: "#FDECEC", border: "1px solid #F5C2C2", borderRadius: 12, padding: "11px 13px", display: "flex", gap: 9, alignItems: "flex-start" }}>
      <AlertTriangle size={16} color="#C0392B" style={{ flexShrink: 0, marginTop: 1 }} />
      <span style={{ fontSize: 12.5, color: "#A03030", lineHeight: 1.45 }}>{text}</span>
    </div>
  );
}
