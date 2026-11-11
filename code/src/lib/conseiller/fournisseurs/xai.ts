/**
 * xAI, par l'API compatible OpenAI (conseiller-ia.md §2) : `fetch` direct,
 * sans dépendance. Sortie structurée stricte ; si l'API la refuse pour ce
 * modèle (HTTP 400 qui cite `response_format`), nouvel essai dans le même
 * appel budgété avec `json_object` et le schéma recopié en fin de prompt.
 */
import { PROMPT_SCHEMA_DEGRADE } from "@content/prompt-conseiller";
import {
  erreurFetch,
  erreurHttp,
  ErreurLlm,
  type FournisseurLlm,
  type ReponseLlm,
  type RequeteLlm,
} from "../fournisseur";

export const URL_XAI = "https://api.x.ai/v1/chat/completions";

type ReponseXai = {
  model?: string;
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
    completion_tokens_details?: { reasoning_tokens?: number };
    cost_in_usd_ticks?: number;
  };
};

/** Corps de la requête (exporté pour les tests). */
export function corpsXai(requete: RequeteLlm, modele: string, degrade: boolean) {
  const messages = [
    {
      role: "system",
      content: degrade
        ? requete.systeme +
          PROMPT_SCHEMA_DEGRADE.replace("{schema}", JSON.stringify(requete.schema))
        : requete.systeme,
    },
    ...requete.messages.map((m) => ({ role: m.role, content: m.contenu })),
  ];
  return {
    model: modele,
    messages,
    response_format: degrade
      ? { type: "json_object" }
      : {
          type: "json_schema",
          json_schema: { name: requete.nomSchema, strict: true, schema: requete.schema },
        },
    temperature: requete.temperature,
    max_tokens: requete.maxJetonsSortie,
  };
}

/** Lecture de la réponse (exportée pour les tests). */
export function lireReponseXai(json: ReponseXai, dureeMs: number, modele: string): ReponseLlm {
  const choix = json.choices?.[0];
  const brut = choix?.message?.content ?? "";
  if (brut.trim() === "") throw new ErreurLlm("reponse_vide", null, true);
  const raison = choix?.finish_reason;
  const u = json.usage ?? {};
  return {
    brut,
    fin: raison === "length" ? "longueur" : raison === "content_filter" ? "refus" : "complete",
    usage: {
      entree: u.prompt_tokens ?? 0,
      entreeEnCache: u.prompt_tokens_details?.cached_tokens ?? 0,
      sortie: u.completion_tokens ?? 0,
      raisonnement: u.completion_tokens_details?.reasoning_tokens ?? 0,
      coutUsd: typeof u.cost_in_usd_ticks === "number" ? u.cost_in_usd_ticks * 1e-10 : null,
    },
    dureeMs,
    modeleServi: json.model ?? modele,
  };
}

export class FournisseurXai implements FournisseurLlm {
  readonly nom = "xai" as const;
  readonly reel = true;

  constructor(
    private readonly cle: string,
    readonly modele: string,
    private readonly url: string = URL_XAI,
  ) {}

  async generer(requete: RequeteLlm, signal: AbortSignal): Promise<ReponseLlm> {
    const debut = Date.now();
    for (const degrade of [false, true]) {
      let reponse: Response;
      try {
        reponse = await fetch(this.url, {
          method: "POST",
          headers: { Authorization: `Bearer ${this.cle}`, "Content-Type": "application/json" },
          body: JSON.stringify(corpsXai(requete, this.modele, degrade)),
          signal,
        });
      } catch (e) {
        throw erreurFetch(e, signal);
      }
      if (reponse.status === 400 && !degrade) {
        const texte = await reponse.text().catch(() => "");
        if (texte.includes("response_format") || texte.includes("json_schema")) continue;
        throw erreurHttp(400);
      }
      if (!reponse.ok) throw erreurHttp(reponse.status);
      let json: ReponseXai;
      try {
        json = (await reponse.json()) as ReponseXai;
      } catch (e) {
        throw erreurFetch(e, signal);
      }
      return { ...lireReponseXai(json, Date.now() - debut, this.modele), schemaDegrade: degrade };
    }
    throw erreurHttp(400);
  }
}
