export default abstract class BaseMapper<E,M> {

  abstract toModel(entity: E): Partial<M>

  abstract toEntity(model:M): E
}