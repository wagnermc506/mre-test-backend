import { IsString, MaxLength } from "class-validator";

export class UpdateNoticiaDto {
    @IsString()
    @MaxLength(255)
    titulo: string;

    @IsString()
    descricao: string;
}