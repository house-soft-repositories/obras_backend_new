import { OmitType } from '@nestjs/swagger';
import UserDto from '@/modules/users/dtos/user.dto';

export default class UserRequestContext extends OmitType(UserDto, [
  'password',
] as const) {}
