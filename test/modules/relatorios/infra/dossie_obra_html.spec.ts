import { montarHtmlDossie } from '@/modules/relatorios/infra/reporting/dossie_obra_html';
import type { SecaoRelatorio } from '@/modules/relatorios/domain/relatorios/exportar_lista_obras';

function secoesBase(): SecaoRelatorio[] {
  return [
    { titulo: 'Equipe', linhas: ['Ana — Responsavel'] },
    { titulo: 'Contrato', linhas: ['Número: CT-10'] },
  ];
}

describe('montarHtmlDossie', () => {
  it('monta documento com título, seções e anexo vazio', () => {
    const html = montarHtmlDossie({
      titulo: 'Dossiê da Obra',
      subtitulo: 'OB-001 · Escola Modelo',
      secoes: secoesBase(),
      fotos: [],
      omitidas: 0,
    });

    expect(html).toContain('<h1>Dossiê da Obra</h1>');
    expect(html).toContain('OB-001 · Escola Modelo');
    expect(html).toContain('<h2>Equipe</h2>');
    expect(html).toContain('Ana — Responsavel');
    expect(html).toContain('Anexo fotográfico');
    expect(html).toContain('Sem fotos cadastradas');
  });

  it('embute fotos como data URI com legenda e data formatada', () => {
    const html = montarHtmlDossie({
      titulo: 'Dossiê da Obra',
      subtitulo: 'OB-001',
      secoes: secoesBase(),
      fotos: [
        {
          dataUri: 'data:image/jpeg;base64,QUJD',
          legenda: 'Fachada',
          data: '2026-09-01',
        },
      ],
      omitidas: 0,
    });

    expect(html).toContain('src="data:image/jpeg;base64,QUJD"');
    expect(html).toContain('1. Fachada');
    expect(html).toContain('01/09/2026');
    expect(html).not.toContain('omitida(s)');
  });

  it('informa fotos omitidas quando há truncamento', () => {
    const html = montarHtmlDossie({
      titulo: 'Dossiê da Obra',
      subtitulo: 'OB-001',
      secoes: secoesBase(),
      fotos: [
        { dataUri: 'data:image/png;base64,AA==', legenda: 'A', data: '' },
      ],
      omitidas: 3,
    });

    expect(html).toContain('3 foto(s) omitida(s)');
  });

  it('escapa HTML injetado em títulos, linhas e legendas', () => {
    const html = montarHtmlDossie({
      titulo: 'Dossiê <b>da Obra</b>',
      subtitulo: 'x',
      secoes: [{ titulo: 'S', linhas: ['<script>alert(1)</script>'] }],
      fotos: [
        {
          dataUri: 'data:image/jpeg;base64,AA==',
          legenda: '<img onerror=x>',
          data: '',
        },
      ],
      omitidas: 0,
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img onerror=x&gt;');
  });
});
