-- supabase/migrations/0004_column_aliases.sql
-- Alignement des colonnes SQL avec les types TypeScript du frontend.
-- Ajouter les colonnes attendues par le code sans casser les scripts Python.

-- products : ajouter name_fr comme colonne generee depuis inn_name
-- Le frontend utilise products.name_fr ; le SQL avait inn_name.
alter table products
  add column if not exists name_fr text generated always as (inn_name) stored;

-- transfer_recommendations : ajouter qty_recommended
-- Le frontend utilise qty_recommended ; le SQL avait quantity.
alter table transfer_recommendations
  add column if not exists qty_recommended integer generated always as (quantity) stored;

-- PipelineRun : l'interface TypeScript utilise PipelineRun.id
-- mais la table SQL a run_id comme cle primaire.
-- On ajoute un alias pour la compatibilite des requetes .eq('id', ...)
-- NOTE : Les routes API ont ete corrigees pour utiliser .eq('run_id', ...) donc
-- cet alias n'est plus necessaire. Migration conservee pour documentation.

-- Verification recommandee apres execution :
--   SELECT id, inn_name, name_fr FROM products LIMIT 3;
--   SELECT id, quantity, qty_recommended FROM transfer_recommendations LIMIT 3;
