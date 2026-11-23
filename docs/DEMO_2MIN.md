# Démonstration en 2 minutes

Objectif : montrer le parcours complet avec Groq réel, sans envoi d'email réel.

## Option automatique

Depuis la racine du projet :

```powershell
powershell -ExecutionPolicy Bypass -File scripts/demo-2min.ps1
```

Le script vérifie les services puis exécute `scripts/e2e-demo.mjs`.
Résultat attendu : `E2E_SUCCESS` puis `DEMO_SUCCESS`.

## Option manuelle dans l'interface

1. Ouvrir `http://localhost:3000/login`.
2. Se connecter avec `demo@leadflow.ai` / `DemoPass123!`.
3. Ouvrir `http://localhost:3000/prospects`, cliquer sur **Nouveau prospect**
   et saisir :
   - société : `Demo BioTools SAS`
   - contact : `Alice Martin`
   - email : `alice.martin@example.test`
   - site : `https://example.test`
   - secteur : `Laboratory software`
   - description : `Laboratory software company evaluating a targeted B2B outreach workflow.`
4. Ouvrir le prospect et cliquer sur **Analyser avec l'IA**.
5. Attendre l'analyse : score, catégorie, confiance et recommandations
   apparaissent dans la fiche et sur le dashboard.
6. Cliquer sur **Générer un brouillon**, puis ouvrir l'onglet **Brouillons**.
7. Ouvrir le brouillon `PENDING_REVIEW`, vérifier que le texte est généré par
   Groq à partir des faits fournis, puis cliquer sur **Approuver**.
8. Cliquer explicitement sur **Envoyer**. Le statut passe à `SENT`.
9. Ouvrir `http://localhost:3000/activity` : l'événement
   `EMAIL_SENT_SIMULATED` confirme qu'aucun email réel n'a été livré.

## Limites de la démo

- Sans clé `GROQ_API_KEY`, WF-01/WF-02 échouent avec
  `GROQ_API_KEY is not configured`.
- Le modèle utilisé est `GROQ_MODEL` (`openai/gpt-oss-120b` par défaut).
- Le mode `EMAIL_PROVIDER=console` ne livre aucun email réel.
