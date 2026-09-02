# Arquitetura do Projeto Base API

## Visão Geral

Este projeto segue os princípios da **Clean Architecture** e **Domain-Driven Design (DDD)**, organizando o código em camadas bem definidas que promovem a separação de responsabilidades, testabilidade e manutenibilidade.

## Estrutura das Camadas

### 1. **Domain (Domínio)**

A camada de domínio contém a lógica de negócio pura e é independente de qualquer framework ou tecnologia externa.

#### **Entities (Entidades)**
- Contêm as regras de negócio fundamentais
- **NÃO são domínios anêmicos** - possuem comportamentos e validações
- Exemplo: `UserEntity` com validações de email, nome e senha

```typescript
// Exemplo de Entity com regras de negócio
export default class UserEntity {
  private constructor(private readonly props: UserEntityProps) {}
  
  static create(props: Omit<UserEntityProps, "id" | "createdAt" | "updatedAt">) {
    this.validate(props); // Validação das regras de negócio
    return new UserEntity({
      ...props,
      id: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
  
  // Métodos com lógica de negócio...
}
```

#### **Use Cases (Casos de Uso)**
- Interfaces que definem as operações de negócio
- Seguem o padrão `UseCase<Input, Output>`
- Definem contratos que serão implementados na camada de aplicação

```typescript
// Interface do Use Case
export default interface UseCase<P, R> {
  execute(param: P): AsyncResult<AppException, R>;
}

// Use Case específico
export default interface ICreateUserUseCase
  extends UseCase<CreateUserParam, CreateUserResponse> {}
```

### 2. **Application (Aplicação)**

Camada responsável pela **implementação dos Use Cases**, orquestrando as operações de negócio.

#### **Services**
- Implementam as interfaces dos Use Cases
- Coordenam chamadas para repositories e outros serviços
- Contêm a lógica de aplicação (não de negócio)

```typescript
export default class CreateUserService implements ICreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly encryptionService: IEncryptionService,
  ) {}

  async execute(param: CreateUserParam): AsyncResult<AppException, CreateUserResponse> {
    // Orquestração da lógica de aplicação
  }
}
```

### 3. **Adapters (Adaptadores)**

Camada que **adapta tecnologias externas** para interfaces conhecidas pelo domínio.

#### **Interfaces de Repository**
- Definem contratos para persistência de dados
- Abstraem detalhes de implementação do banco de dados

```typescript
export default interface IUserRepository {
  findOne(query: UserQueryOptions): AsyncResult<AppException, UserEntity>;
  save(user: UserEntity): AsyncResult<AppException, UserEntity>;
}
```

#### **Outros Adapters**
- Serviços de Storage
- APIs externas
- Sistemas de notificação
- Qualquer dependência externa

### 4. **Infrastructure (Infraestrutura)**

Camada que contém as **implementações concretas** dos adapters.

#### **Repositories**
- Implementações concretas dos adapters de repository
- Geralmente usando ORMs como TypeORM

```typescript
export default class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {}
  
  async findOne(query: UserQueryOptions): AsyncResult<AppException, UserEntity> {
    // Implementação específica do TypeORM
  }
}
```

#### **Mappers**
- Convertem entre modelos de infraestrutura e entidades de domínio
- Exemplo: `UserMapper.toEntity(userModel)`

#### **Models (Read Models)**
- Modelos específicos da tecnologia de persistência
- Representam a estrutura dos dados no banco

```typescript
@Entity('users')
export default class UserModel {
  @PrimaryGeneratedColumn()
  id: number;
  
  @Column()
  email: string;
  
  // Outras propriedades...
}
```

## Sistema de Injeção de Dependência

### **Symbols**
Cada módulo possui um arquivo `symbols.ts` na raiz que define as chaves para injeção de dependência:

```typescript
// symbols.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const CREATE_USER_SERVICE = Symbol('CREATE_USER_SERVICE');
```

### **Modules**
Arquivo responsável pela configuração da injeção de dependência usando NestJS:

```typescript
@Module({
  providers: [
    {
      inject: [getRepositoryToken(UserModel)],
      provide: USER_REPOSITORY,
      useFactory: (userRepository: Repository<UserModel>) =>
        new UserRepository(userRepository),
    },
    {
      inject: [USER_REPOSITORY, EncryptionService],
      provide: CREATE_USER_SERVICE,
      useFactory: (userRepository: IUserRepository, encryption: IEncryptionService) => 
        new CreateUserService(userRepository, encryption),
    },
  ],
})
export default class UsersModule {}
```

## Fluxo de Dados

1. **Controller** recebe a requisição
2. **Controller** chama o **Use Case** (via Service)
3. **Service** (Application) coordena a operação
4. **Service** usa **Repositories** (via interface)
5. **Repository** (Infrastructure) acessa o banco de dados
6. **Mapper** converte Model para Entity
7. **Entity** aplica regras de negócio
8. Retorno segue o caminho inverso

## Tratamento de Erros

O projeto utiliza o padrão **Either** para tratamento de erros:

```typescript
type AsyncResult<E, R> = Promise<Either<E, R>>;

// Uso
const result = await userRepository.findOne(query);
if (result.isLeft()) {
  // Tratamento do erro
  return left(new ServiceException(ErrorMessages.USER_NOT_FOUND));
}
// Sucesso
const user = result.value;
```

## Vantagens da Arquitetura

1. **Testabilidade**: Cada camada pode ser testada isoladamente
2. **Manutenibilidade**: Separação clara de responsabilidades
3. **Flexibilidade**: Fácil substituição de implementações
4. **Independência**: Domínio independente de frameworks
5. **Escalabilidade**: Estrutura que cresce de forma organizada

## Exemplo Prático: Feature de Usuários

```
src/modules/users/
├── symbols.ts                     # Símbolos para DI
├── users.module.ts               # Configuração do módulo
├── domain/
│   ├── entities/
│   │   └── user.entity.ts        # Entidade com regras de negócio
│   └── usecase/
│       └── i_create_user_use_case.ts  # Interface do caso de uso
├── application/
│   └── create_user.service.ts    # Implementação do caso de uso
├── adapters/
│   └── i_user.repository.ts      # Interface do repository
└── infra/
    ├── models/
    │   └── user.model.ts         # Modelo do banco de dados
    ├── mapper/
    │   └── user.mapper.ts        # Conversão Model ↔ Entity
    └── repositories/
        └── user.repository.ts    # Implementação do repository
```

## Diretrizes para Novas Features

1. **Comece pelo Domain**: Defina entities e use cases
2. **Implemente Application**: Crie services que implementem os use cases
3. **Defina Adapters**: Crie interfaces para dependências externas
4. **Implemente Infrastructure**: Crie implementações concretas
5. **Configure Module**: Registre dependências no módulo
6. **Use Symbols**: Defina símbolos para injeção de dependência

Esta arquitetura garante que o código seja limpo, testável e facilmente extensível, seguindo as melhores práticas de desenvolvimento de software.