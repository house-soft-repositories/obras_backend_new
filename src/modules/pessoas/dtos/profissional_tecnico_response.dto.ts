import { ProfissionalTecnicoComPessoaProps } from '@/modules/pessoas/domain/entities/profissional_tecnico.entity';

export default class ProfissionalTecnicoResponseDto {
  static fromView(view: ProfissionalTecnicoComPessoaProps) {
    return {
      id: view.id,
      pessoaId: view.pessoaId,
      nome: view.nome,
      documento: view.documento,
      conselho: view.conselho,
      numeroRegistro: view.numeroRegistro,
      ufRegistro: view.ufRegistro,
      titulo: view.titulo,
      ativo: view.ativo,
      registro: view.registro,
      createdAt: view.createdAt.toISOString(),
      updatedAt: view.updatedAt.toISOString(),
    };
  }
}
