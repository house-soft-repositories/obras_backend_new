/**
 * Renderer HTML→PDF via Puppeteer/Chromium. O binário é resolvido nesta
 * ordem: `CHROMIUM_EXECUTABLE_PATH` (ou `CHROME_EXECUTABLE_PATH`) e os
 * caminhos usuais do sistema. Sem Chromium disponível, `renderHtml` lança —
 * o service de dossiê trata isso com fallback para o PDF textual simples,
 * de modo que o endpoint continua funcional em ambientes mínimos.
 */
import { existsSync } from 'node:fs';
import type IPdfRenderer from '@/modules/relatorios/adapters/pdf_renderer.interface';
import {
  CHROMIUM_NAO_ENCONTRADO,
} from '@/modules/relatorios/infra/reporting/chromium_erro';
import puppeteer from 'puppeteer-core';

const CANDIDATOS_BINARIO = [
  process.env.CHROMIUM_EXECUTABLE_PATH,
  process.env.CHROME_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
].filter((candidato): candidato is string => Boolean(candidato));

export function resolverBinarioChromium(): string | null {
  for (const candidato of CANDIDATOS_BINARIO) {
    try {
      if (existsSync(candidato)) return candidato;
    } catch {
      continue;
    }
  }
  return null;
}

export default class PuppeteerPdfRenderer implements IPdfRenderer {
  constructor(private readonly timeoutMs = 30000) {}

  async renderHtml(html: string): Promise<Buffer> {
    const executablePath = resolverBinarioChromium();
    if (!executablePath) {
      throw new Error(CHROMIUM_NAO_ENCONTRADO);
    }
    const browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    });
    try {
      const page = await browser.newPage();
      page.setDefaultNavigationTimeout(this.timeoutMs);
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: this.timeoutMs,
      });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
