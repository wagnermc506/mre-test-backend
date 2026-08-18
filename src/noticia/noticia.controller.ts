import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { NoticiaService } from "./noticia.service";
import { UpdateNoticiaDto } from "./dto/update-noticia.dto";
import { CreateNoticiaDto } from "./dto/create-noticia.dto";
import { FindNoticiasQueryDto } from "./dto/find-noticias-query.dto";

@Controller('noticias')
export class NoticiaController {
    constructor(private readonly noticiaService: NoticiaService) {}

    @Post()
    create(@Body() dto: CreateNoticiaDto) {
        return this.noticiaService.create(dto);
    }

    @Get()
    findAll(@Query() query: FindNoticiasQueryDto) {
        return this.noticiaService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.noticiaService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateNoticiaDto) {
        return this.noticiaService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.noticiaService.remove(id);
    }
}
