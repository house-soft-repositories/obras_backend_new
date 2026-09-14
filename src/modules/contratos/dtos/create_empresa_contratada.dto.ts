import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, Length, MinLength } from 'class-validator';
export default class CriarEmpresaContratadaDto {
  @ApiProperty() @IsString() @MinLength(1) razaoSocial!: string;
  @ApiProperty() @IsString() cnpj!: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  responsavel?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cargoResponsavel?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cep?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() logradouro?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() numero?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() complemento?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() bairro?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() cidade?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @Length(2, 2) uf?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsBoolean() ativo?: boolean;
  @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() @IsString({ each: true }) telefones?: string[];
}

export class AtualizarEmpresaContratadaDto extends PartialType(CriarEmpresaContratadaDto) {}
