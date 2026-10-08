/**
 * Template HTML do dossiê da obra pública, renderizado para PDF via
 * Puppeteer/Chromium. Função PURA (testável sem browser): recebe as seções
 * de texto e as fotos já preparadas (data URIs) e devolve o documento.
 */
import type { SecaoRelatorio } from '@/modules/relatorios/domain/relatorios/exportar_lista_obras';
import {
  MAX_BYTES_TOTAL_DOSSIE,
  MAX_FOTOS_DOSSIE,
  formatarData,
  type FotoProntaDossie,
} from '@/modules/relatorios/domain/relatorios/dossie_obra';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

const CSS = `
  @page { size: A4; margin: 18mm 14mm 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1f2933; font-size: 11px; line-height: 1.45; margin: 0; }
  header.capa { border-bottom: 3px solid #0f766e; padding-bottom: 10px; margin-bottom: 14px; }
  header.capa h1 { font-size: 22px; color: #0f766e; margin: 0 0 4px 0; }
  header.capa p.sub { font-size: 12px; color: #6b7280; margin: 0; }
  header.capa p.meta { font-size: 9px; color: #9aa0a6; margin: 4px 0 0 0; }
  section.secao { margin-bottom: 14px; page-break-inside: avoid; }
  section.secao h2 { font-size: 14px; color: #0f766e; border-bottom: 1px solid #d1d5db; padding-bottom: 3px; margin: 0 0 6px 0; }
  section.secao ul { margin: 0; padding-left: 18px; }
  section.secao li { margin-bottom: 2px; }
  section.anexo { page-break-before: always; }
  section.anexo h2 { font-size: 16px; color: #0f766e; margin: 0 0 8px 0; }
  figure.foto { margin: 0 0 14px 0; page-break-inside: avoid; }
  figure.foto img { display: block; max-width: 100%; max-height: 340px; margin: 0 auto; border: 1px solid #d1d5db; }
  figure.foto figcaption { margin-top: 4px; }
  figure.foto figcaption .legenda { font-size: 11px; font-weight: bold; }
  figure.foto figcaption .data { font-size: 9px; color: #6b7280; }
  div.quebra { page-break-after: always; }
  p.omitidas { font-size: 10px; color: #b91c1c; }
  p.vazio { font-size: 11px; color: #6b7280; font-style: italic; }
`;

export interface HtmlDossieParam {
  titulo: string;
  subtitulo: string;
  secoes: SecaoRelatorio[];
  fotos: FotoProntaDossie[];
  omitidas: number;
  geradoEm?: string;
}

export function montarHtmlDossie(param: HtmlDossieParam): string {
  const geradoEm = param.geradoEm ?? new Date().toISOString();
  const secoes = param.secoes
    .map(
      (s) => `<section class="secao"><h2>${escapeHtml(s.titulo)}</h2><ul>${s.linhas
        .map((l) => `<li>${escapeHtml(l)}</li>`)
        .join('')}</ul></section>`,
    )
    .join('\n');

  const figuras = param.fotos
    .map(
      (f, i) =>
        `<figure class="foto"><img src="${escapeAttr(f.dataUri)}" alt="${escapeAttr(`Foto ${i + 1}`)}"/>` +
        `<figcaption><div class="legenda">${i + 1}. ${escapeHtml(f.legenda)}</div>` +
        `<div class="data">${escapeHtml(formatarData(f.data))}</div></figcaption></figure>` +
        // Duas fotos por página, como no legado (pdfkit): quebra após cada par.
        (i % 2 === 1 && i < param.fotos.length - 1 ? '<div class="quebra"></div>' : ''),
    )
    .join('\n');

  const omitidas =
    param.omitidas > 0
      ? `<p class="omitidas">${param.omitidas} foto(s) omitida(s) por exceder o limite de ` +
        `${MAX_FOTOS_DOSSIE} imagens ou ${Math.round(MAX_BYTES_TOTAL_DOSSIE / 1024 / 1024)} MB deste relatório.</p>`
      : '';

  const anexo =
    param.fotos.length > 0
      ? `<section class="anexo"><h2>Anexo fotográfico</h2>${figuras}${omitidas}</section>`
      : `<section class="anexo"><h2>Anexo fotográfico</h2><p class="vazio">Sem fotos cadastradas para esta obra.</p>${omitidas}</section>`;

  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"/><title>${escapeHtml(
    param.titulo,
  )}</title><style>${CSS}</style></head><body>` +
    `<header class="capa"><h1>${escapeHtml(param.titulo)}</h1>` +
    `<p class="sub">${escapeHtml(param.subtitulo)}</p>` +
    `<p class="meta">Gerado em ${escapeHtml(geradoEm)}</p></header>` +
    `<main>${secoes}</main>${anexo}</body></html>`;
}
