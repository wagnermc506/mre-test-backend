import { InjectRepository } from "@nestjs/typeorm";
import { Noticia } from "./entities/noticia.entity";
import { ILike, Repository } from "typeorm";
import { CreateNoticiaDto } from "./dto/create-noticia.dto";
import { Injectable, NotFoundException } from "@nestjs/common";
import { UpdateNoticiaDto } from "./dto/update-noticia.dto";
import { FindNoticiasQueryDto } from "./dto/find-noticias-query.dto";
import { NoticiaCacheService } from "./noticia-cache.service";

export interface PaginatedNoticias {
    data: Noticia[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

@Injectable()
export class NoticiaService {
    constructor(
        @InjectRepository(Noticia) private readonly noticiaRepository: Repository<Noticia>,
        private readonly cache: NoticiaCacheService,
    ) {}

    async create(dto: CreateNoticiaDto): Promise<Noticia> {
        const noticia = this.noticiaRepository.create(dto);
        const created = await this.noticiaRepository.save(noticia);
        this.cache.clear();
        return created;
    }

    async findAll(query: FindNoticiasQueryDto): Promise<PaginatedNoticias> {
        const { page, limit, search } = query;
        const cacheKey = `list:page=${page}:limit=${limit}:search=${search ?? ''}`;

        const cached = this.cache.get<PaginatedNoticias>(cacheKey);
        if (cached) {
            return cached;
        }

        const where = search
            ? [{ titulo: ILike(`%${search}%`) }, { descricao: ILike(`%${search}%`) }]
            : undefined;

        const [data, total] = await this.noticiaRepository.findAndCount({
            where,
            skip: (page - 1) * limit,
            take: limit,
        });

        const result: PaginatedNoticias = {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        this.cache.set(cacheKey, result);
        return result;
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
        const updated = await this.noticiaRepository.save(noticia);
        this.cache.clear();
        return updated;
    }

    async remove(id: string): Promise<void> {
        const noticia = await this.findOne(id);
        await this.noticiaRepository.remove(noticia);
        this.cache.clear();
    }
}
