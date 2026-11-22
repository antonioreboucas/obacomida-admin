import type { PlatformSettings } from '../types';

/**
 * Utilitários de URLs personalizadas e Slugs das lojas Oba Comida.
 *
 * Suporta configuração dinâmica dos domínios do App e do Parceiro
 * com fallback inteligente para 'obacomida.com.br'.
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

/**
 * Recupera configurações salvas no localStorage sem criar dependência circular com o DB
 */
function getActiveSettings(): Partial<PlatformSettings> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('obacomida_settings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

/**
 * Monta a URL completa do Aplicativo do Consumidor
 * Ex: https://app-obacomida.vercel.app/{slug}
 */
export function getStoreAppUrl(slug: string, overrideSettings?: Partial<PlatformSettings>): string {
  const clean = sanitizeSlug(slug);
  const cfg = overrideSettings || getActiveSettings();

  // Domínio padrão atualizado para o app na Vercel
  const domain = (cfg?.appDomain || 'app-obacomida.vercel.app')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const protocol = cfg?.appProtocol || 'https';
  // Rota direta: /{slug}
  const rawPattern = cfg?.appPathPattern || '/{slug}';

  const pattern = rawPattern.replace('{slug}', clean);
  const path = pattern.startsWith('/') ? pattern : `/${pattern}`;

  return `${protocol}://${domain}${path}`;
}

/**
 * Monta a URL completa do Painel do Parceiro
 * Ex: https://obacomida-partner.vercel.app/{slug} ou https://obacomida.com.br/{slug}
 */
export function getStorePartnerUrl(slug: string, overrideSettings?: Partial<PlatformSettings>): string {
  const clean = sanitizeSlug(slug);
  const cfg = overrideSettings || getActiveSettings();

  const domain = (cfg?.partnerDomain || 'obacomida-partner.vercel.app')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const protocol = cfg?.partnerProtocol || 'https';
  const rawPattern = cfg?.partnerPathPattern || '/{slug}';

  const pattern = rawPattern.replace('{slug}', clean);
  const path = pattern.startsWith('/') ? pattern : `/${pattern}`;

  return `${protocol}://${domain}${path}`;
}

/**
 * Versão amigável de exibição do link do App (sem http/https)
 * Ex: app-obacomida.vercel.app/nomeloja
 */
export function getStoreAppUrlDisplay(slug: string, overrideSettings?: Partial<PlatformSettings>): string {
  const clean = sanitizeSlug(slug);
  const cfg = overrideSettings || getActiveSettings();

  const domain = (cfg?.appDomain || 'app-obacomida.vercel.app')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const rawPattern = cfg?.appPathPattern || '/{slug}';

  const pattern = rawPattern.replace('{slug}', clean);
  const path = pattern.startsWith('/') ? pattern : `/${pattern}`;

  return `${domain}${path}`;
}

/**
 * Versão amigável de exibição do link do Parceiro (sem http/https)
 * Ex: obacomida.com.br/nomeloja
 */
export function getStorePartnerUrlDisplay(slug: string, overrideSettings?: Partial<PlatformSettings>): string {
  const clean = sanitizeSlug(slug);
  const cfg = overrideSettings || getActiveSettings();

  const domain = (cfg?.partnerDomain || 'obacomida-partner.vercel.app')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  const rawPattern = cfg?.partnerPathPattern || '/{slug}';

  const pattern = rawPattern.replace('{slug}', clean);
  const path = pattern.startsWith('/') ? pattern : `/${pattern}`;

  return `${domain}${path}`;
}
