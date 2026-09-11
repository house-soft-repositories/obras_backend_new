import MeReadModel from '@/modules/auth/domain/read_models/me.read_model';
import MeResponseDto from '@/modules/auth/dtos/me_response.dto';

export default abstract class MeMapper {
  static toResponse(model: MeReadModel): MeResponseDto {
    return {
      id: model.id,
      name: model.name,
      email: model.email,
      role: model.role,
      tenant: model.tenant ? { id: model.tenant.id, name: model.tenant.name } : null,
      createdAt: model.createdAt.toISOString(),
      updatedAt: model.updatedAt.toISOString(),
    };
  }
}
