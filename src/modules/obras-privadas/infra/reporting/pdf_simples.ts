import { SecaoRelatorio } from '@/modules/obras-privadas/domain/relatorios/relatorio_privadas';

function escapePdfText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapLine(value: string, max = 92): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length > max) {
      lines.push(current);
      current = word;
      continue;
    }
    current = `${current} ${word}`;
  }
  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

function buildContent(
  title: string,
  subtitle: string,
  sections: SecaoRelatorio[],
): string {
  const commands = [
    'BT',
    '/F1 16 Tf',
    '50 790 Td',
    `(${escapePdfText(title)}) Tj`,
  ];
  if (subtitle) {
    commands.push('/F1 9 Tf', '0 -18 Td', `(${escapePdfText(subtitle)}) Tj`);
  }
  commands.push('/F1 11 Tf', '0 -24 Td');

  for (const section of sections) {
    commands.push(
      '/F1 12 Tf',
      `(${escapePdfText(section.titulo)}) Tj`,
      '/F1 9 Tf',
      '0 -14 Td',
    );
    for (const line of section.linhas) {
      for (const wrapped of wrapLine(line)) {
        commands.push(`(${escapePdfText(wrapped)}) Tj`, '0 -11 Td');
      }
    }
    commands.push('0 -8 Td');
  }

  commands.push('ET');
  return commands.join('\n');
}

export function gerarPdfSimples(
  title: string,
  subtitle: string,
  sections: SecaoRelatorio[],
): Buffer {
  const content = buildContent(title, subtitle, sections);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index++) {
    pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}
