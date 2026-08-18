import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateNoticiaDto {
    @IsString()
    @MaxLength(255)
    @IsOptional()
    titulo: string;

    @IsString()
    @IsOptional()
    descricao: string;
}