#!/usr/bin/env node
// Guard: prevent deploying to production with mock mode enabled.
if (
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_USE_MOCKS === 'true'
) {
  console.error(
    'ERREUR BUILD : Mode maquette actif en production. Désactiver NEXT_PUBLIC_USE_MOCKS.'
  );
  process.exit(1);
}
