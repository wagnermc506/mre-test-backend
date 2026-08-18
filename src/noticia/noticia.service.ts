import { InjectRepository } from "@nestjs/typeorm";
import { Noticia } from "./entities/noticia.entity";
import { ILike, Repository } from "typeorm";
import { CreateNoticiaDto } from "./dto/create-noticia.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateNoticiaDto } from "./dto/update-noticia.dto";
import { FindNoticiasQueryDto } from "./dto/find-noticias-query.dto";

@Injectable()
export class NoticiaService {
    constructor(
        @InjectRepository(Noticia) private readonly noticiaRepository: Repository<Noticia>
    ) {}

    async create(dto: CreateNoticiaDto): Promise<Noticia> {
        const noticia = this.noticiaRepository.create(dto);
        return await this.noticiaRepository.save(noticia);
    }

    async findAll(query: FindNoticiasQueryDto) {
        const { page, limit, search } = query;

        const where = search
            ? [{ titulo: ILike(`%${search}%`) }, { descricao: ILike(`%${search}%`) }]
            : undefined;

        const [data, total] = await this.noticiaRepository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findOne(id: string): Promise<Noticia> {
        const noticia = await this.noticiaRepository.findOneBy({ id });
        if (!noticia) {
            throw new NotFoundException(`Noticia ${id} não encontrada`);
        }
        return noticia;
    }

    async update(id: string, dto: UpdateNoticiaDto): Promise<Noticia> {
        const noticia = await this.findOne(id);
        Object.assign(noticia, dto);
        return this.noticiaRepository.save(noticia);
    }

    async remove(id: string): Promise<void> {
        const noticia = await this.findOne(id);
        await this.noticiaRepository.remove(noticia);
    }
}