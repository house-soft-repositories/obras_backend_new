import { IsJWT, IsString } from 'class-validator';

export default class RefreshTokenDto {
  @IsString()
  @IsJWT()
  refreshToken: string;
}
