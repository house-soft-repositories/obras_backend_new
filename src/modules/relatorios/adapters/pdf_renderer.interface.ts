/**
 * Contrato do renderer HTML→PDF dos relatórios. A implementação padrão usa
 * Puppeteer/Chromium (`infra/reporting/puppeteer_pdf_renderer.ts`); testes
 * unitários injetam um mock.
 */
export default interface IPdfRenderer {
  renderHtml(html: string): Promise<Buffer>;
}
