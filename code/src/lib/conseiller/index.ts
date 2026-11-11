/**
 * Conseiller IA (tâche 2.4) : point d'entrée, côté serveur seulement.
 *
 *   const { conseil, resultat } = await conseiller(reponses, { bilanId });
 *
 * Flux (docs/conception/conseiller-ia.md §1.1, revu par la passe qualité de
 * 2.4) : présélection du moteur → un appel LLM qui choisit parmi les
 * candidats et rédige → validateur → réparation par le code (reparation.ts)
 * → si un champ reste au gabarit ou si le choix est fautif, une relance
 * ciblée sur les seules pistes concernées → le meilleur des deux conseils
 * réparés, ou le repli total (calcul seul et gabarits). Le code compose les
 * textes et écrit tous les faits ; le LLM n'écrit aucun chiffre.
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import {
  PROMPT_RELANCE,
  PROMPT_RELANCE_CIBLEE,
  PROMPT_SYSTEME,
  PROMPT_UTILISATEUR,
  VERSION_PROMPT,
} from "@content/prompt-conseiller";
import { conseiller as textes } from "@content/conseiller";
import { config as configCourante, type Config } from "@/lib/config";
import { VERSION_MOTEUR } from "@/lib/moteur/constantes";
import { chargerIndexMoteur } from "@/lib/moteur/donnees";
import { preselectionner } from "@/lib/moteur/preselection";
import { reponsesEffectives } from "@/lib/moteur/profil";
import { resultatAvecPistes } from "@/lib/moteur/resultat";
import type { IndexMoteur, ResultatMoteur } from "@/lib/moteur/types";
import { VERSION_QUESTIONNAIRE } from "@/lib/questionnaire/definition";
import type { Reponses } from "@/lib/questionnaire/reponses";
import { CompteurFichier, type CompteurAppels, type MotifAppel } from "./budget";
import { construireCharge } from "./charge";
import { accorderLibelle, composerEnfant, composerPourquoi } from "./composer";
import {
  choisirFournisseur,
  ErreurLlm,
  type FournisseurLlm,
  type ReponseLlm,
  type RequeteLlm,
} from "./fournisseur";
import {
  compterEchecs,
  hacherBilan,
  journalParDefaut,
  type Journal,
  type LigneJournal,
  type StatutAppel,
} from "./journal";
import { phraseDeBase } from "./raisons";
import {
  meilleur,
  metierSimplementDe,
  reparer,
  traits,
  type Mixte,
  type PisteTravail,
} from "./reparation";
import { sortieGabarits } from "./repli";
import { correctionSchema, schemaCorrection, schemaSortie } from "./schema";
import type {
  Charge,
  Conseil,
  Echec,
  LienEnfant,
  LienParent,
  MotifRepli,
  PisteConseil,
  SortieLlm,
} from "./types";
import { valider } from "./validateur";

export type { Charge, Conseil, Echec, SortieLlm } from "./types";
export { construireCharge } from "./charge";
export { valider } from "./validateur";
export { sortieGabarits } from "./repli";
export { composerEnfant, composerPourquoi, accorderLibelle } from "./composer";

/**
 * Délais (§1.3) : appel 1 de 35 s, 55 s en tout. La relance ciblée ne réécrit
 * qu'une ou deux pistes (quelques secondes) : elle reste possible jusqu'à 40 s
 * écoulées (28 s pour la relance complète de la conception ; passe qualité).
 */
export const DELAIS = { appelMs: 35_000, relanceSiEcouleMaxMs: 40_000, totalMs: 55_000 };

/** Paramètres de génération (§2) ; `jetonsParPiste` : sortie permise à la relance ciblée, par piste. */
export const GENERATION = {
  maxJetonsSortie: 4000,
  jetonsParPiste: 1500,
  temperature: 0.4,
  motifsMax: 15,
};

export type OptionsConseiller = {
  config?: Config;
  /** Fournisseur imposé (tests) ; `null` : aucun ; absent : selon la configuration. */
  fournisseur?: FournisseurLlm | null;
  compteur?: CompteurAppels;
  motif?: MotifAppel;
  index?: IndexMoteur;
  journal?: Journal;
  /** Identifiant du bilan (haché dans le journal). */
  bilanId?: string;
  delais?: Partial<typeof DELAIS>;
  maintenant?: () => number;
  simplementPreRediges?: ReadonlyMap<string, string>;
};

export type DetailTentative = {
  tentative: number;
  statut: StatutAppel;
  echecs: Echec[];
  reponse: ReponseLlm | null;
};

export type ResultatConseiller = {
  conseil: Conseil;
  resultat: ResultatMoteur;
  charge: Charge;
  /** Détail des appels (essais, tests) ; jamais journalisé tel quel. */
  tentatives: DetailTentative[];
};

/** Requête du tour 1 (§4.2) : la charge en JSON compact, clés dans un ordre fixe. */
export function construireRequete(charge: Charge): RequeteLlm {
  const utilisateur = PROMPT_UTILISATEUR.replace(
    "{nombre_de_pistes}",
    String(charge.envoi.nombre_de_pistes),
  ).replace("{charge}", JSON.stringify(charge.envoi));
  return {
    systeme: PROMPT_SYSTEME,
    messages: [{ role: "user", contenu: utilisateur }],
    schema: schemaSortie(charge),
    nomSchema: "conseil",
    maxJetonsSortie: GENERATION.maxJetonsSortie,
    temperature: GENERATION.temperature,
  };
}

function listeMotifs(echecs: readonly Echec[]): string {
  return [...echecs]
    .sort((a, b) => Number(b.nature === "choix") - Number(a.nature === "choix"))
    .slice(0, GENERATION.motifsMax)
    .map((e) => `- ${e.message}`)
    .join("\n");
}

/**
 * Requête de relance complète (§4.3) : seulement quand la première réponse
 * est illisible (V01) ; tous les motifs, choix d'abord, 15 au plus.
 */
export function construireRelance(requete: RequeteLlm, brut: string, echecs: Echec[]): RequeteLlm {
  const motifs = listeMotifs(echecs);
  return {
    ...requete,
    messages: [
      ...requete.messages,
      { role: "assistant", contenu: brut },
      { role: "user", contenu: PROMPT_RELANCE.replace("{motifs}", motifs) },
    ],
  };
}

export type Cibles = { remplace: string[]; nombre: number; motifs: Echec[] };

/**
 * Pistes à réécrire par une relance ciblée (passe qualité de 2.4) : une par
 * piste complétée par le calcul (le modèle choisit laquelle des pistes en
 * cause remplacer), une par piste dont un champ visible est resté au gabarit
 * ou dont le « pourquoi » parent n'a plus qu'un lien de trait. `null` : rien
 * à relancer.
 */
export function ciblesRelance(
  charge: Charge,
  sortie: SortieLlm,
  echecs: readonly Echec[],
  m: Mixte | null,
): Cibles | null {
  const codes = sortie.pistes.map((p) => p.code);
  const choix = echecs.filter((e) => e.nature === "choix");
  const enCause = new Set(choix.flatMap((e) => e.codes ?? []).filter((c) => codes.includes(c)));
  let nombre = choix.length > 0 ? Math.max(1, m?.completees.length ?? 1) : 0;
  const textes = (m?.pistes ?? []).filter(
    (p) =>
      !m?.completees.includes(p.code) &&
      (p.parent.origine === "gabarit" ||
        traits(p.parent.liens, charge) < 2 ||
        p.enfant.origine === "gabarit" ||
        p.metierSimplement.origine === "gabarit"),
  );
  for (const p of textes) {
    if (!enCause.has(p.code)) nombre += 1;
    enCause.add(p.code);
  }
  if (nombre === 0 || enCause.size === 0) return null;
  const remplace = codes.filter((c) => enCause.has(c));
  const motifs = echecs.filter(
    (e) =>
      e.nature === "choix" || (e.piste !== undefined && enCause.has(e.piste)) || e.code === "T15",
  );
  return { remplace, nombre: Math.min(nombre, remplace.length), motifs };
}

/** Requête de relance ciblée : les motifs, puis les seules pistes à réécrire. */
export function construireRelanceCiblee(
  requete: RequeteLlm,
  brut: string,
  charge: Charge,
  cibles: Cibles,
): RequeteLlm {
  const message = PROMPT_RELANCE_CIBLEE.replace("{motifs}", listeMotifs(cibles.motifs))
    .replace("{nombre}", String(cibles.nombre))
    .replace("{codes}", cibles.remplace.join(", "));
  return {
    ...requete,
    messages: [
      ...requete.messages,
      { role: "assistant", contenu: brut },
      { role: "user", contenu: message },
    ],
    schema: schemaCorrection(charge, cibles.remplace, cibles.nombre),
    nomSchema: "correction",
    maxJetonsSortie: Math.min(
      GENERATION.maxJetonsSortie,
      GENERATION.jetonsParPiste * cibles.nombre,
    ),
  };
}

/**
 * La sortie du premier appel, où chaque piste réécrite remplace celle dont
 * elle donne le code. `null` : la correction est illisible.
 */
export function fusionnerCorrection(sortie: SortieLlm, brut: string): SortieLlm | null {
  let objet: unknown;
  try {
    objet = JSON.parse(brut);
  } catch {
    return null;
  }
  const lu = correctionSchema.safeParse(objet);
  if (!lu.success) return null;
  const pistes = [...sortie.pistes];
  const faites = new Set<number>();
  for (const { remplace, ...piste } of lu.data.pistes) {
    const k = pistes.findIndex((p, i) => p.code === remplace && !faites.has(i));
    if (k === -1) continue;
    pistes[k] = piste;
    faites.add(k);
  }
  return { analyse: sortie.analyse, pistes };
}

/** Empreinte des réponses effectives, clés triées (§8.1). */
export function empreinteReponses(reponses: Reponses): string {
  const effectives = reponsesEffectives(reponses);
  const tri = Object.fromEntries(Object.entries(effectives).sort(([a], [b]) => (a < b ? -1 : 1)));
  return createHash("sha256").update(JSON.stringify(tri)).digest("hex");
}

// ---------------------------------------------------------------------------
// Composition du conseil
// ---------------------------------------------------------------------------

/** Pistes entièrement écrites par les gabarits (repli total). */
function pistesGabarits(charge: Charge, sortie: SortieLlm): PisteTravail[] {
  return sortie.pistes.map((p) => ({
    code: p.code,
    metierSimplement: metierSimplementDe(charge, p.code),
    iaPhrase: "",
    parent: { liens: p.pourquoi_parent, origine: "gabarit" },
    enfant: { liens: p.pourquoi_enfant, origine: "gabarit" },
    raisonDuChoix: null,
  }));
}

function texteParent(liens: readonly LienParent[]): string {
  return liens.length === 0 ? textes.pourquoiParent.sansLien : composerPourquoi(liens);
}

function texteEnfant(liens: readonly LienEnfant[]): string {
  return liens.length === 0 ? textes.pourquoiEnfant.sansLien : composerEnfant(liens);
}

function assembler(
  charge: Charge,
  pistes: PisteTravail[],
  resultat: ResultatMoteur,
  base: Omit<Conseil, "pistes" | "ecartes" | "version" | "creeLe">,
  index: IndexMoteur,
  maintenant: () => number,
): Conseil {
  const libelleDe = (code: string) => {
    const m = index.parCode.get(code);
    return m ? accorderLibelle(m.libelle, charge.genre) : code;
  };
  const pistesConseil: PisteConseil[] = pistes.map((p) => {
    const candidat = charge.candidats.get(p.code);
    const iaAffichee = candidat?.envoye.ia.afficher === true && p.iaPhrase.trim() !== "";
    return {
      code_rome: p.code,
      metier: libelleDe(p.code),
      metierSimplement: p.metierSimplement,
      iaPhrase: iaAffichee ? { texte: p.iaPhrase, origine: "llm" } : null,
      pourquoiParent: {
        liens: p.parent.liens,
        texte: texteParent(p.parent.liens),
        origine: p.parent.origine,
      },
      pourquoiEnfant: {
        liens: p.enfant.liens,
        texte: texteEnfant(p.enfant.liens),
        origine: p.enfant.origine,
      },
      raisonDuChoix: p.raisonDuChoix,
    };
  });
  // Écartés recalculés avec les pistes finales (§7.4), phrase écrite par le code.
  const ecartes = resultat.ecartes.map((e) => ({
    code_rome: e.code_rome,
    metier: libelleDe(e.code_rome),
    raison: phraseDeBase(e.raison, { genre: charge.genre, libelleDe }),
    origine: "gabarit" as const,
  }));
  return {
    version: 1,
    ...base,
    pistes: pistesConseil,
    ecartes,
    creeLe: new Date(maintenant()).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function ecrireTrace(
  cfg: Config,
  bilan: string,
  tentative: number,
  requete: RequeteLlm,
  reponse: unknown,
) {
  if (!cfg.llm?.trace) return;
  const dossier = join(process.cwd(), ".llm", "traces");
  mkdirSync(dossier, { recursive: true });
  writeFileSync(
    join(dossier, `${bilan}-${tentative}.json`),
    JSON.stringify({ requete, reponse }, null, 2),
  );
}

/** Génère le conseil d'un bilan (§1.1). Ne lève pas d'erreur LLM : tout échec mène au repli. */
export async function conseiller(
  reponses: Reponses,
  options: OptionsConseiller = {},
): Promise<ResultatConseiller> {
  const cfg = options.config ?? configCourante();
  const index = options.index ?? chargerIndexMoteur();
  const maintenant = options.maintenant ?? Date.now;
  const delais = { ...DELAIS, ...options.delais };
  const journal = options.journal ?? journalParDefaut();
  const motif = options.motif ?? "bilan";
  const debut = maintenant();

  const preselection = preselectionner(reponses, { index });
  const charge = construireCharge(reponses, {
    index,
    preselection,
    ...(options.simplementPreRediges && { simplementPreRediges: options.simplementPreRediges }),
  });
  const fournisseur =
    options.fournisseur !== undefined ? options.fournisseur : await choisirFournisseur(cfg);
  const bilan = hacherBilan(options.bilanId ?? empreinteReponses(reponses), cfg.signature.cle);
  const empreinte = {
    prompt: VERSION_PROMPT,
    moteur: VERSION_MOTEUR,
    catalogue: index.empreintes.catalogue,
    questionnaire: VERSION_QUESTIONNAIRE,
    reponses: empreinteReponses(reponses),
  };
  const tentatives: DetailTentative[] = [];
  let appels = 0;

  const ligne = (
    tentative: number,
    statut: StatutAppel,
    echecs: readonly Echec[],
    reponse: ReponseLlm | null,
  ): LigneJournal => ({
    le: new Date(maintenant()).toISOString(),
    motif,
    bilan,
    fournisseur: fournisseur?.nom ?? "aucun",
    modele: fournisseur?.modele ?? "aucun",
    modele_servi: reponse?.modeleServi ?? null,
    tentative,
    statut,
    echecs: compterEchecs(echecs.map((e) => e.code)),
    duree_ms: reponse?.dureeMs ?? 0,
    entree: reponse?.usage.entree ?? 0,
    entree_cache: reponse?.usage.entreeEnCache ?? 0,
    sortie: reponse?.usage.sortie ?? 0,
    raisonnement: reponse?.usage.raisonnement ?? 0,
    cout_usd: reponse?.usage.coutUsd ?? null,
    versions: {
      prompt: VERSION_PROMPT,
      moteur: VERSION_MOTEUR,
      catalogue: index.empreintes.catalogue.slice(0, 12),
    },
  });

  const fournisseurConseil = (r: ReponseLlm | null) =>
    fournisseur
      ? {
          nom: fournisseur.nom,
          modele: fournisseur.modele,
          modeleServi: r?.modeleServi ?? fournisseur.modele,
        }
      : null;

  const repliTotal = (motifRepli: MotifRepli, derniere: ReponseLlm | null): ResultatConseiller => {
    const sortie = sortieGabarits(charge);
    if (fournisseur) journal(ligne(appels, "repli_total", [], null));
    const conseil = assembler(
      charge,
      pistesGabarits(charge, sortie),
      preselection.repli,
      {
        source: "repli",
        motifRepli,
        empreinte,
        fournisseur: fournisseurConseil(derniere),
        analyse: null,
        champsRemplaces: [],
        appels,
      },
      index,
      maintenant,
    );
    return { conseil, resultat: preselection.repli, charge, tentatives };
  };

  if (fournisseur === null) return repliTotal("sans_cle", null);
  (fournisseur as FournisseurLlm & { preparer?: (c: Charge) => void }).preparer?.(charge);
  const compteur =
    options.compteur ??
    new CompteurFichier(
      isAbsolute(cfg.llm?.compteurFichier ?? "")
        ? (cfg.llm?.compteurFichier as string)
        : join(process.cwd(), cfg.llm?.compteurFichier ?? ".llm/compteur.json"),
      cfg.llm?.budget,
    );

  /** Un appel, budget réservé avant. `null` : budget refusé. */
  const appeler = async (
    requete: RequeteLlm,
    delaiMs: number,
  ): Promise<{ reponse: ReponseLlm } | { erreur: ErreurLlm } | null> => {
    if (fournisseur.reel) {
      const accepte = await compteur.reserver(motif);
      if (!accepte) return null;
      appels += 1;
    }
    const controle = new AbortController();
    const minuterie = setTimeout(() => controle.abort(), Math.max(1, delaiMs));
    try {
      const reponse = await fournisseur.generer(requete, controle.signal);
      ecrireTrace(cfg, bilan, tentatives.length + 1, requete, reponse.brut);
      return { reponse };
    } catch (e) {
      const erreur =
        e instanceof ErreurLlm
          ? e
          : controle.signal.aborted
            ? new ErreurLlm("delai", null, false)
            : new ErreurLlm("reseau", null, true);
      return { erreur };
    } finally {
      clearTimeout(minuterie);
    }
  };

  const statutErreur = (e: ErreurLlm): StatutAppel =>
    e.type === "http"
      ? `http_${e.statut ?? 0}`
      : e.type === "delai"
        ? "delai"
        : e.type === "reseau"
          ? "reseau"
          : "reponse_vide";
  const motifErreur = (e: ErreurLlm): MotifRepli => (e.type === "delai" ? "delai" : "http");

  // Appel 1
  const requete = construireRequete(charge);
  let resultat1 = await appeler(requete, delais.appelMs);
  if (resultat1 === null) {
    journal(ligne(1, "budget_atteint", [], null));
    return repliTotal("budget", null);
  }
  let relanceFaite = false;
  if ("erreur" in resultat1) {
    const erreur = resultat1.erreur;
    tentatives.push({ tentative: 1, statut: statutErreur(erreur), echecs: [], reponse: null });
    journal(ligne(1, statutErreur(erreur), [], null));
    const ecoule = maintenant() - debut;
    if (!erreur.relancable || ecoule > delais.relanceSiEcouleMaxMs) {
      return repliTotal(motifErreur(erreur), null);
    }
    // La même requête, une fois : c'est la relance unique.
    relanceFaite = true;
    resultat1 = await appeler(requete, delais.totalMs - ecoule - 2000);
    if (resultat1 === null) {
      journal(ligne(2, "budget_atteint", [], null));
      return repliTotal("budget", null);
    }
    if ("erreur" in resultat1) {
      tentatives.push({
        tentative: 2,
        statut: statutErreur(resultat1.erreur),
        echecs: [],
        reponse: null,
      });
      journal(ligne(2, statutErreur(resultat1.erreur), [], null));
      return repliTotal(motifErreur(resultat1.erreur), null);
    }
  }
  const reponse1 = resultat1.reponse;
  const n1 = tentatives.length + 1;
  const v1 = valider(reponse1.brut, charge, { fin: reponse1.fin });
  const statut1: StatutAppel =
    v1.echecs.length === 0
      ? reponse1.schemaDegrade
        ? "schema_degrade"
        : "ok"
      : "echec_validation";
  tentatives.push({ tentative: n1, statut: statut1, echecs: v1.echecs, reponse: reponse1 });
  journal(ligne(n1, statut1, v1.echecs, reponse1));

  // Réparation par le code, puis, s'il reste un champ au gabarit ou un trio
  // partiel, une relance ciblée (ou complète si la réponse est illisible).
  let sortie = v1.sortie;
  let mixte = sortie === null ? null : reparer(charge, sortie, v1.echecs);
  let reponse = reponse1;
  const cibles = sortie === null ? null : ciblesRelance(charge, sortie, v1.echecs, mixte);
  const ecoule = maintenant() - debut;
  if (
    !relanceFaite &&
    (sortie === null || cibles !== null) &&
    ecoule <= delais.relanceSiEcouleMaxMs
  ) {
    const relance =
      sortie !== null && cibles !== null
        ? construireRelanceCiblee(requete, reponse1.brut, charge, cibles)
        : construireRelance(requete, reponse1.brut, v1.echecs);
    const resultat2 = await appeler(relance, delais.totalMs - ecoule - 2000);
    if (resultat2 === null) {
      journal(ligne(2, "budget_atteint", [], null));
    } else if ("erreur" in resultat2) {
      tentatives.push({
        tentative: 2,
        statut: statutErreur(resultat2.erreur),
        echecs: [],
        reponse: null,
      });
      journal(ligne(2, statutErreur(resultat2.erreur), [], null));
    } else {
      const r2 = resultat2.reponse;
      const brut2 =
        sortie !== null && relance.nomSchema === "correction"
          ? fusionnerCorrection(sortie, r2.brut)
          : r2.brut;
      const v2 = valider(brut2 ?? "", charge, { fin: r2.fin });
      const statut2: StatutAppel = v2.echecs.length === 0 ? "ok" : "echec_validation";
      tentatives.push({ tentative: 2, statut: statut2, echecs: v2.echecs, reponse: r2 });
      journal(ligne(2, statut2, v2.echecs, r2));
      if (v2.sortie !== null) {
        const mixte2 = reparer(charge, v2.sortie, v2.echecs);
        const choisi = meilleur(mixte, mixte2);
        if (choisi !== mixte) {
          mixte = choisi;
          sortie = v2.sortie;
          reponse = r2;
        }
      }
    }
  }

  if (sortie === null || mixte === null) return repliTotal("validation", reponse);
  if (mixte.completees.length > 0) journal(ligne(appels, "trio_partiel", [], null));
  else if (mixte.remplaces.length > 0) journal(ligne(appels, "repli_champ", [], null));
  const resultat = resultatAvecPistes(
    reponses,
    mixte.pistes.map((p) => p.code),
    index,
  );
  const conseil = assembler(
    charge,
    mixte.pistes,
    resultat,
    {
      source: mixte.completees.length > 0 ? "partiel" : "llm",
      motifRepli: null,
      empreinte,
      fournisseur: fournisseurConseil(reponse),
      analyse: mixte.analyseFautive ? null : sortie.analyse,
      champsRemplaces: mixte.remplaces,
      appels,
    },
    index,
    maintenant,
  );
  return { conseil, resultat, charge, tentatives };
}
