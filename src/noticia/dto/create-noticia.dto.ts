import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateNoticiaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  titulo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;
}
