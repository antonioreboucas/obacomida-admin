/**
 * Utilitários de URLs personalizadas e Slugs das lojas Oba Comida.
 *
 * Estrutura de links solicitada:
 * - Aplicativo do Consumidor: obacomida.com.br/{slug}-app
 * - Painel do Parceiro (Restaurante): obacomida.com.br/{slug}
 */

export function generateSlug(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentuação
    .replace(/[^a-z0-9]+/g, '-') // caracteres especiais e espaços viram hífen
    .replace(/^-+|-+$/g, ''); // limpa hífens no início e final
}

export function sanitizeSlug(slug: string): string {
  if (!slug) return '';
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

export function getStoreAppUrl(slug: string): string {
  const clean = sanitizeSlug(slug);
  return `https://obacomida.com.br/${clean}-app`;
}

export function getStorePartnerUrl(slug: string): string {
  const clean = sanitizeSlug(slug);
  return `https://obacomida.com.br/${clean}`;
}

export function getStoreAppUrlDisplay(slug: string): string {
  const clean = sanitizeSlug(slug);
  return `obacomida.com.br/${clean}-app`;
}

export function getStorePartnerUrlDisplay(slug: string): string {
  const clean = sanitizeSlug(slug);
  return `obacomida.com.br/${clean}`;
}
