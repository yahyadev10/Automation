'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { formatDate as formatDateUtil } from '@/lib/utils';

export type Language = 'fr' | 'en';

const fr = {
  languageLabel: 'Langue de l’interface',
  languageFr: 'Français',
  languageEn: 'English',
  loading: 'Chargement…',
  retry: 'Réessayer',
  unknownError: 'Erreur inconnue',
  actionFailed: 'Action impossible',
  open: 'Ouvrir',
  previous: 'Précédent',
  next: 'Suivant',
  all: 'Tous',
  notProvided: 'non renseigné',
  createdAt: 'Créé le',
  contact: 'Contact',
  email: 'Email',
  website: 'Site web',
  description: 'Description',
  industry: 'Secteur',
  company: 'Entreprise',
  status: 'Statut',
  action: 'Action',
  source: 'source',
  confidence: 'confiance',
  model: 'Modèle',
  prompt: 'prompt',
  outOf100: '/ 100',
  demoOnly: 'réservé au développement',
  appTagline: 'Qualification assistée par IA',
  navDashboard: 'Vue d’ensemble',
  navProspects: 'Prospects',
  navDrafts: 'Brouillons',
  navActivity: 'Activité',
  mainNavigation: 'Navigation principale',
  account: 'Compte',
  logout: 'Déconnexion',
  loginTitle: 'Connexion',
  loginSubtitle: 'Accédez à l’espace de qualification et de suivi des prospects.',
  loginError: 'Identifiants invalides ou service indisponible.',
  password: 'Mot de passe',
  signIn: 'Se connecter',
  signingIn: 'Connexion…',
  demoAccount: 'Compte de démonstration',
  sessionChecking: 'Vérification de la session…',
  statusNew: 'Nouveaux',
  statusAnalyzing: 'En analyse',
  statusQualified: 'Qualifiés',
  statusNotQualified: 'Non qualifiés',
  statusError: 'Erreurs',
  categoryHigh: 'Score élevé',
  categoryMedium: 'Score moyen',
  categoryLow: 'Score faible',
  loadingDashboard: 'Chargement du tableau de bord…',
  statProspects: 'Prospects',
  statQualified: 'Qualifiés',
  statAnalyses: 'Analyses',
  statPendingDrafts: 'À relire',
  hintTotalRecorded: 'Total enregistré',
  hintQualifiedStatus: 'Statut QUALIFIED',
  hintAiResults: 'Résultats IA',
  hintPendingDrafts: 'Brouillons en attente',
  dashboardTitle: 'Vue d’ensemble',
  dashboardSubtitle: 'Indicateurs calculés depuis PostgreSQL et activités récentes.',
  demoData: 'Données de démonstration',
  keyMetrics: 'Indicateurs principaux',
  prospectDistribution: 'Répartition des prospects',
  analysisCategories: 'Catégories d’analyse',
  recentActivity: 'Dernières activités',
  viewAll: 'Voir tout',
  noActivityYet: 'Aucune activité pour le moment.',
  prospectsTitle: 'Prospects',
  prospectsSubtitle: 'Recherchez, filtrez et lancez l’analyse des entreprises suivies.',
  closeForm: 'Fermer le formulaire',
  newProspect: 'Nouveau prospect',
  createFailed: 'Création impossible',
  creating: 'Création…',
  createProspect: 'Créer le prospect',
  searchProspect: 'Rechercher un prospect',
  searchPlaceholder: 'Rechercher une entreprise ou un contact…',
  filterByStatus: 'Filtrer par statut',
  loadingProspects: 'Chargement des prospects…',
  noProspect: 'Aucun prospect',
  noProspectDescription: 'Créez un prospect ou ajustez vos filtres pour afficher des résultats.',
  tableCompany: 'Entreprise',
  tableContact: 'Contact',
  tableStatus: 'Statut',
  tableCreatedAt: 'Créé le',
  tableAction: 'Action',
  industryNotProvided: 'Secteur non renseigné',
  resultOne: '{count} résultat — page {page} / {pages}',
  resultMany: '{count} résultats — page {page} / {pages}',
  loadingProspect: 'Chargement du prospect…',
  backToProspects: '← Retour aux prospects',
  backToDrafts: '← Retour aux brouillons',
  analyzeWithAi: 'Analyze with AI',
  analyzing: 'Analyse en cours…',
  generateDraft: 'Générer un brouillon',
  generating: 'Génération…',
  information: 'Informations',
  lastQualification: 'Dernière qualification',
  noAnalysisHint: 'Aucune analyse. Lancez « Analyze with AI » pour obtenir un score et des recommandations.',
  strengths: 'Points forts',
  weaknesses: 'Faiblesses',
  missingInformation: 'Informations manquantes',
  recommendations: 'Recommandations',
  analysisHistory: 'Historique des analyses',
  noAnalysisRecorded: 'Aucune analyse enregistrée.',
  draftsSection: 'Brouillons',
  noDraftHint: 'Aucun brouillon. La génération reste manuelle et nécessite une analyse.',
  draftsTitle: 'Brouillons email',
  draftsSubtitle: 'Chaque envoi nécessite une approbation explicite depuis la fiche du brouillon.',
  filterPendingReview: 'À relire',
  filterApproved: 'Approuvés',
  filterSent: 'Envoyés',
  filterRejected: 'Rejetés',
  filterFailed: 'Échecs',
  loadingDrafts: 'Chargement des brouillons…',
  noDraft: 'Aucun brouillon',
  noDraftDescription: 'Générez un brouillon depuis la fiche d’un prospect qualifié.',
  draftOne: '{count} brouillon',
  draftMany: '{count} brouillons',
  loadingDraft: 'Chargement du brouillon…',
  draftSaved: 'Brouillon mis à jour.',
  confirmSend: 'Confirmer l’envoi de ce brouillon ? Cette action est définitive.',
  sendRequested: 'Demande d’envoi transmise.',
  draftTitle: 'Brouillon',
  createdUpdated: 'Créé le {created} · mis à jour le {updated}',
  subject: 'Objet',
  content: 'Contenu',
  save: 'Enregistrer',
  approvedNotice: 'Brouillon approuvé. L’envoi reste manuel.',
  approve: 'Approuver',
  rejectedNotice: 'Brouillon rejeté.',
  reject: 'Rejeter',
  sendSimulationNotice: 'Envoi simulé par défaut : aucun email réel n’est livré.',
  send: 'Envoyer',
  sentSimulationOn: 'Envoyé (simulation) le {date}.',
  activityTitle: 'Activité',
  activitySubtitle: 'Journal chronologique des événements enregistrés par le backend.',
  loadingActivity: 'Chargement de l’historique…',
  noEvent: 'Aucun événement',
  noEventDescription: 'Les actions apparaîtront ici au fur et à mesure.',
  msgQualificationStarted: 'Qualification lancée. Le résultat arrivera par callback.',
  msgDraftStarted: 'Génération du brouillon lancée.',
  msgSendSimulated: 'Envoi simulé par n8n (aucun email réel livré)',
  msgSendRequested: 'Envoi demandé',
  status_NEW: 'Nouveau',
  status_ANALYZING: 'En analyse',
  status_QUALIFIED: 'Qualifié',
  status_NOT_QUALIFIED: 'Non qualifié',
  status_ERROR: 'Erreur',
  status_HIGH: 'Élevé',
  status_MEDIUM: 'Moyen',
  status_LOW: 'Faible',
  status_PENDING_REVIEW: 'À relire',
  status_APPROVED: 'Approuvé',
  status_REJECTED: 'Rejeté',
  status_SENT: 'Envoyé',
  status_FAILED: 'Échec',
  status_SUCCESS: 'Succès',
  status_FAILURE: 'Échec',
  status_PROSPECT_CREATED: 'Prospect créé',
  status_PROSPECT_UPDATED: 'Prospect modifié',
  status_PROSPECT_DELETED: 'Prospect archivé',
  status_QUALIFICATION_REQUESTED: 'Analyse demandée',
  status_QUALIFICATION_COMPLETED: 'Analyse terminée',
  status_QUALIFICATION_FAILED: 'Analyse échouée',
  status_EMAIL_DRAFT_REQUESTED: 'Brouillon demandé',
  status_EMAIL_DRAFT_CREATED: 'Brouillon créé',
  status_EMAIL_DRAFT_UPDATED: 'Brouillon modifié',
  status_EMAIL_DRAFT_APPROVED: 'Brouillon approuvé',
  status_EMAIL_DRAFT_REJECTED: 'Brouillon rejeté',
  status_EMAIL_SEND_REQUESTED: 'Envoi demandé',
  status_EMAIL_SENT_SIMULATED: 'Envoi simulé',
  status_EMAIL_SENT: 'Email envoyé',
  status_EMAIL_SEND_FAILED: 'Envoi échoué',
  status_AUTOMATION_ERROR: 'Erreur automatisation',
} as const;

type TranslationKey = keyof typeof fr;
type TranslationParams = Record<string, string | number>;

const en: Record<TranslationKey, string> = {
  languageLabel: 'Interface language',
  languageFr: 'Français',
  languageEn: 'English',
  loading: 'Loading…',
  retry: 'Retry',
  unknownError: 'Unknown error',
  actionFailed: 'Action failed',
  open: 'Open',
  previous: 'Previous',
  next: 'Next',
  all: 'All',
  notProvided: 'not provided',
  createdAt: 'Created on',
  contact: 'Contact',
  email: 'Email',
  website: 'Website',
  description: 'Description',
  industry: 'Industry',
  company: 'Company',
  status: 'Status',
  action: 'Action',
  source: 'source',
  confidence: 'confidence',
  model: 'Model',
  prompt: 'prompt',
  outOf100: '/ 100',
  demoOnly: 'development only',
  appTagline: 'AI-assisted qualification',
  navDashboard: 'Overview',
  navProspects: 'Prospects',
  navDrafts: 'Drafts',
  navActivity: 'Activity',
  mainNavigation: 'Main navigation',
  account: 'Account',
  logout: 'Sign out',
  loginTitle: 'Sign in',
  loginSubtitle: 'Access the qualification and prospect follow-up workspace.',
  loginError: 'Invalid credentials or service unavailable.',
  password: 'Password',
  signIn: 'Sign in',
  signingIn: 'Signing in…',
  demoAccount: 'Demo account',
  sessionChecking: 'Checking session…',
  statusNew: 'New',
  statusAnalyzing: 'Analyzing',
  statusQualified: 'Qualified',
  statusNotQualified: 'Not qualified',
  statusError: 'Errors',
  categoryHigh: 'High score',
  categoryMedium: 'Medium score',
  categoryLow: 'Low score',
  loadingDashboard: 'Loading dashboard…',
  statProspects: 'Prospects',
  statQualified: 'Qualified',
  statAnalyses: 'Analyses',
  statPendingDrafts: 'To review',
  hintTotalRecorded: 'Total recorded',
  hintQualifiedStatus: 'QUALIFIED status',
  hintAiResults: 'AI results',
  hintPendingDrafts: 'Drafts waiting',
  dashboardTitle: 'Overview',
  dashboardSubtitle: 'Metrics calculated from PostgreSQL and recent activities.',
  demoData: 'Demo data',
  keyMetrics: 'Key metrics',
  prospectDistribution: 'Prospect distribution',
  analysisCategories: 'Analysis categories',
  recentActivity: 'Recent activity',
  viewAll: 'View all',
  noActivityYet: 'No activity yet.',
  prospectsTitle: 'Prospects',
  prospectsSubtitle: 'Search, filter and analyze the tracked companies.',
  closeForm: 'Close form',
  newProspect: 'New prospect',
  createFailed: 'Creation failed',
  creating: 'Creating…',
  createProspect: 'Create prospect',
  searchProspect: 'Search a prospect',
  searchPlaceholder: 'Search a company or a contact…',
  filterByStatus: 'Filter by status',
  loadingProspects: 'Loading prospects…',
  noProspect: 'No prospect',
  noProspectDescription: 'Create a prospect or adjust your filters to display results.',
  tableCompany: 'Company',
  tableContact: 'Contact',
  tableStatus: 'Status',
  tableCreatedAt: 'Created on',
  tableAction: 'Action',
  industryNotProvided: 'Industry not provided',
  resultOne: '{count} result — page {page} / {pages}',
  resultMany: '{count} results — page {page} / {pages}',
  loadingProspect: 'Loading prospect…',
  backToProspects: '← Back to prospects',
  backToDrafts: '← Back to drafts',
  analyzeWithAi: 'Analyze with AI',
  analyzing: 'Analyzing…',
  generateDraft: 'Generate draft',
  generating: 'Generating…',
  information: 'Information',
  lastQualification: 'Latest qualification',
  noAnalysisHint: 'No analysis. Run "Analyze with AI" to get a score and recommendations.',
  strengths: 'Strengths',
  weaknesses: 'Weaknesses',
  missingInformation: 'Missing information',
  recommendations: 'Recommendations',
  analysisHistory: 'Analysis history',
  noAnalysisRecorded: 'No analysis recorded.',
  draftsSection: 'Drafts',
  noDraftHint: 'No draft. Generation is manual and requires an analysis.',
  draftsTitle: 'Email drafts',
  draftsSubtitle: 'Every send requires explicit approval from the draft detail page.',
  filterPendingReview: 'To review',
  filterApproved: 'Approved',
  filterSent: 'Sent',
  filterRejected: 'Rejected',
  filterFailed: 'Failed',
  loadingDrafts: 'Loading drafts…',
  noDraft: 'No draft',
  noDraftDescription: 'Generate a draft from a qualified prospect detail page.',
  draftOne: '{count} draft',
  draftMany: '{count} drafts',
  loadingDraft: 'Loading draft…',
  draftSaved: 'Draft updated.',
  confirmSend: 'Confirm sending this draft? This action is final.',
  sendRequested: 'Send request submitted.',
  draftTitle: 'Draft',
  createdUpdated: 'Created on {created} · updated on {updated}',
  subject: 'Subject',
  content: 'Content',
  save: 'Save',
  approvedNotice: 'Draft approved. Sending remains manual.',
  approve: 'Approve',
  rejectedNotice: 'Draft rejected.',
  reject: 'Reject',
  sendSimulationNotice: 'Sending is simulated by default: no real email is delivered.',
  send: 'Send',
  sentSimulationOn: 'Sent (simulation) on {date}.',
  activityTitle: 'Activity',
  activitySubtitle: 'Chronological log of events recorded by the backend.',
  loadingActivity: 'Loading history…',
  noEvent: 'No event',
  noEventDescription: 'Actions will appear here as they happen.',
  msgQualificationStarted: 'Qualification started. Result will arrive via callback.',
  msgDraftStarted: 'Draft generation started.',
  msgSendSimulated: 'Send simulated by n8n (no real email delivered)',
  msgSendRequested: 'Send requested',
  status_NEW: 'New',
  status_ANALYZING: 'Analyzing',
  status_QUALIFIED: 'Qualified',
  status_NOT_QUALIFIED: 'Not qualified',
  status_ERROR: 'Error',
  status_HIGH: 'High',
  status_MEDIUM: 'Medium',
  status_LOW: 'Low',
  status_PENDING_REVIEW: 'Pending review',
  status_APPROVED: 'Approved',
  status_REJECTED: 'Rejected',
  status_SENT: 'Sent',
  status_FAILED: 'Failed',
  status_SUCCESS: 'Success',
  status_FAILURE: 'Failure',
  status_PROSPECT_CREATED: 'Prospect created',
  status_PROSPECT_UPDATED: 'Prospect updated',
  status_PROSPECT_DELETED: 'Prospect archived',
  status_QUALIFICATION_REQUESTED: 'Analysis requested',
  status_QUALIFICATION_COMPLETED: 'Analysis completed',
  status_QUALIFICATION_FAILED: 'Analysis failed',
  status_EMAIL_DRAFT_REQUESTED: 'Draft requested',
  status_EMAIL_DRAFT_CREATED: 'Draft created',
  status_EMAIL_DRAFT_UPDATED: 'Draft updated',
  status_EMAIL_DRAFT_APPROVED: 'Draft approved',
  status_EMAIL_DRAFT_REJECTED: 'Draft rejected',
  status_EMAIL_SEND_REQUESTED: 'Send requested',
  status_EMAIL_SENT_SIMULATED: 'Send simulated',
  status_EMAIL_SENT: 'Email sent',
  status_EMAIL_SEND_FAILED: 'Send failed',
  status_AUTOMATION_ERROR: 'Automation error',
};

const dictionaries: Record<Language, Record<TranslationKey, string>> = { fr, en };

const backendMessageKeys: Record<string, TranslationKey> = {
  'Qualification started. Result will arrive via callback.': 'msgQualificationStarted',
  'Draft generation started.': 'msgDraftStarted',
  'Send simulated by n8n (no real email delivered)': 'msgSendSimulated',
  'Send requested': 'msgSendRequested',
};

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(params[key] ?? ''));
}

function readableStatus(value: string): string {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function translateStatus(value: string, language: Language): string {
  const key = `status_${value}` as TranslationKey;
  const dictionary = dictionaries[language] as Record<string, string>;
  return dictionary[key] ?? readableStatus(value);
}

export function localizeMessage(message: string | null | undefined, language: Language): string {
  if (!message) return '';
  const key = backendMessageKeys[message.trim()];
  return key ? dictionaries[language][key] : message;
}

const activityPrefixes: Array<[string, string]> = [
  ['Prospect created for ', 'Prospect créé pour '],
  ['Prospect updated for ', 'Prospect modifié pour '],
  ['Prospect archived for ', 'Prospect archivé pour '],
  ['AI qualification requested for ', 'Analyse IA demandée pour '],
  ['AI qualification could not be started', 'L’analyse IA n’a pas pu être lancée'],
  ['AI qualification failed', 'Analyse IA échouée'],
  ['AI qualification completed with score ', 'Analyse IA terminée avec un score '],
  ['Email draft requested for ', 'Brouillon demandé pour '],
  ['Email draft creation failed', 'Échec de la création du brouillon'],
  ['Email draft created and waiting for human review', 'Brouillon créé et en attente de relecture'],
  ['Draft content edited before approval', 'Brouillon modifié avant approbation'],
  ['Draft explicitly approved by ', 'Brouillon approuvé explicitement par '],
  ['Draft rejected by ', 'Brouillon rejeté par '],
  ['Approved draft explicitly sent by ', 'Brouillon approuvé envoyé explicitement par '],
  ['Email send could not be started', 'L’envoi n’a pas pu être lancé'],
  ['Email send simulated (no real delivery)', 'Envoi simulé (aucune livraison réelle)'],
  ['Email send failed', 'Envoi échoué'],
];

export function localizeActivityDescription(description: string, language: Language): string {
  if (language === 'en') return description;
  const match = activityPrefixes.find(([english]) => description.startsWith(english));
  return match ? `${match[1]}${description.slice(match[0].length)}` : description;
}

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  dateLocale: string;
  formatDate: (value: string | null | undefined) => string;
  statusLabel: (value: string) => string;
  localizeApiMessage: (message: string | null | undefined) => string;
  localizeActivityDescription: (description: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const fallbackI18n: I18nContextValue = {
  language: 'fr',
  setLanguage: () => undefined,
  t: (key, params) => interpolate(dictionaries.fr[key], params),
  dateLocale: 'fr-FR',
  formatDate: (value) => formatDateUtil(value, 'fr-FR'),
  statusLabel: (value) => translateStatus(value, 'fr'),
  localizeApiMessage: (message) => localizeMessage(message, 'fr'),
  localizeActivityDescription: (description) => localizeActivityDescription(description, 'fr'),
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr');

  useEffect(() => {
    const stored = window.localStorage.getItem('leadflow-language');
    if (stored === 'fr' || stored === 'en') setLanguage(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem('leadflow-language', language);
  }, [language]);

  const t = useCallback(
    (key: TranslationKey, params?: TranslationParams) =>
      interpolate(dictionaries[language][key], params),
    [language],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t,
      dateLocale: language === 'fr' ? 'fr-FR' : 'en-US',
      formatDate: (dateValue) => formatDateUtil(dateValue, language === 'fr' ? 'fr-FR' : 'en-US'),
      statusLabel: (statusValue) => translateStatus(statusValue, language),
      localizeApiMessage: (message) => localizeMessage(message, language),
      localizeActivityDescription: (description) => localizeActivityDescription(description, language),
    }),
    [language, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext) ?? fallbackI18n;
}
