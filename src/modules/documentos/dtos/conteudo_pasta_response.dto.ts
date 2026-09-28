import ArquivoResponseDto from '@/modules/documentos/dtos/arquivo_response.dto';
import PastaResponseDto from '@/modules/documentos/dtos/pasta_response.dto';
import type PageMetaEntity from '@/core/pagination/domain/entities/page_meta.entity';
import type { ConteudoPasta } from '@/modules/documentos/domain/usecase/listar_conteudo.usecase';

export interface TrilhaResponseDto {
  id: string;
  nome: string;
}

export default class ConteudoPastaResponseDto {
  pasta: PastaResponseDto;

  trilha: TrilhaResponseDto[];

  subpastas: PastaResponseDto[];

  arquivos: {
    data: ArquivoResponseDto[];
    meta: PageMetaEntity;
  };

  static fromConteudo(c: ConteudoPasta): ConteudoPastaResponseDto {
    const dto = new ConteudoPastaResponseDto();
    dto.pasta = PastaResponseDto.fromEntity(c.pasta);
    dto.trilha = c.trilha.map((t) => ({ id: t.id, nome: t.nome }));
    dto.subpastas = c.subpastas.map((s) => PastaResponseDto.fromEntity(s));
    dto.arquivos = {
      data: c.arquivos.pageData.map((a) => ArquivoResponseDto.fromEntity(a)),
      meta: c.arquivos.pageMeta,
    };
    return dto;
  }
}
