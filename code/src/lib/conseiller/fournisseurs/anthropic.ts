/**
 * Anthropic, en option (conseiller-ia.md §2) : un outil `rendre_conseil` dont
 * le schéma d'entrée est celui de la sortie, choix de l'outil forcé. `fetch`
 * direct, sans dépendance. Le modèle vient de `ANTHROPIC_MODEL` (aucun défaut
 * dans le code). Même prompt, mot pour mot.
 */
import {
  erreurFetch,
  erreurHttp,
  ErreurLlm,
  type FournisseurLlm,
  type ReponseLlm,
  type RequeteLlm,
} from "../fournisseur";

export const URL_ANTHROPIC = "https://api.anthropic.com/v1/messages";

type ReponseAnthropic = {
  model?: string;
  stop_reason?: string;
  content?: { type: string; name?: string; input?: unknown }[];
  usage?: { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number };
};

export class FournisseurAnthropic implements FournisseurLlm {
  readonly nom = "anthropic" as const;
  readonly reel = true;

  constructor(
    private readonly cle: string,
    readonly modele: string,
    private readonly url: string = URL_ANTHROPIC,
  ) {}

  async generer(requete: RequeteLlm, signal: AbortSignal): Promise<ReponseLlm> {
    const debut = Date.now();
    let reponse: Response;
    try {
      reponse = await fetch(this.url, {
        method: "POST",
        headers: {
          "x-api-key": this.cle,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: this.modele,
          max_tokens: requete.maxJetonsSortie,
          temperature: requete.temperature,
          system: requete.systeme,
          messages: requete.messages.map((m) => ({ role: m.role, content: m.contenu })),
          tools: [
            {
              name: "rendre_conseil",
              description: "Rend le conseil au format demandé.",
              input_schema: requete.schema,
            },
          ],
          tool_choice: { type: "tool", name: "rendre_conseil" },
        }),
        signal,
      });
    } catch (e) {
      throw erreurFetch(e, signal);
    }
    if (!reponse.ok) throw erreurHttp(reponse.status);
    let json: ReponseAnthropic;
    try {
      json = (await reponse.json()) as ReponseAnthropic;
    } catch (e) {
      throw erreurFetch(e, signal);
    }
    const bloc = json.content?.find((b) => b.type === "tool_use");
    if (!bloc || bloc.input === undefined) throw new ErreurLlm("reponse_vide", null, true);
    const u = json.usage ?? {};
    return {
      brut: JSON.stringify(bloc.input),
      fin: json.stop_reason === "max_tokens" ? "longueur" : "complete",
      usage: {
        entree: u.input_tokens ?? 0,
        entreeEnCache: u.cache_read_input_tokens ?? 0,
        sortie: u.output_tokens ?? 0,
        raisonnement: 0,
        coutUsd: null,
      },
      dureeMs: Date.now() - debut,
      modeleServi: json.model ?? this.modele,
    };
  }
}
