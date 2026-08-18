import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Noticia } from "../src/noticia/entities/noticia.entity";
import { NoticiaController } from "../src/noticia/noticia.controller";
import { NoticiaService } from "../src/noticia/noticia.service";
import { NoticiaCacheService } from "../src/noticia/noticia-cache.service";
import request from "supertest";
import { App } from "supertest/types";

describe('NoticiaController', () => {
    let app: INestApplication<App>;
    let cacheService: NoticiaCacheService;

    const mockNoticiaRepository = {
        create: jest.fn((dto) => dto),
        save: jest.fn((noticia) => 
            Promise.resolve({ id: 'a1b2c3d4-0000-4000-8000-000000000000', ...noticia }),   
        ),
        findAndCount: jest.fn(),
        findOneBy: jest.fn(),
        remove: jest.fn(),
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [NoticiaController],
            providers: [
                NoticiaService,
                NoticiaCacheService,
                {provide: getRepositoryToken(Noticia), useValue: mockNoticiaRepository},
            ],
        }).compile();

        cacheService = moduleFixture.get(NoticiaCacheService);
        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    afterEach(() => {
        jest.clearAllMocks();
        cacheService.clear();
    });

    describe('dado um payload válido', () => {
        it('então deve criar a noticia e retorna-la com status 201', async () => {
            const payload =  { titulo: 'Título de teste', descricao: 'Descrição de teste' };

            const response = await request(app.getHttpServer())
                .post('/noticias')
                .send(payload)
                .expect(201);

            expect(response.body).toMatchObject(payload);
            expect(response.body.id).toBeDefined();
            expect(mockNoticiaRepository.save).toHaveBeenCalledTimes(1);
        });
    });

    describe('dado um payload sem o campo obrigatório "título"', () => {
        it("então deve rejeitar a requisição com status 400 sem tocar o repositório", async () => {
            await request(app.getHttpServer())
                .post('/noticias')
                .send({ descricao: 'Descrição de teste' })
                .expect(400);

            expect(mockNoticiaRepository.save).not.toHaveBeenCalled();
        });
    });

    describe('GET /noticias', () => {
        describe('dado que existem noticias cadastradas', () => {
            it('então deve retornar a lista paginada com status 200', async () => {
                const noticias = [
                    { id: 'id-1', titulo: 'A', descricao: 'B' },
                    { id: 'id-2', titulo: 'C', descricao: 'D' },
                ];
                mockNoticiaRepository.findAndCount.mockResolvedValueOnce([noticias, 2]);

                const response = await request(app.getHttpServer())
                    .get('/noticias')
                    .expect(200);

                expect(response.body).toEqual({
                    data: noticias,
                    meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
                });
            });
        });

        describe('dado os parâmetros page e limit', () => {
            it('então deve repassá-los para a consulta e para os metadados', async () => {
                mockNoticiaRepository.findAndCount.mockResolvedValueOnce([[], 0]);

                const response = await request(app.getHttpServer())
                    .get('/noticias?page=2&limit=5')
                    .expect(200);

                expect(response.body.meta).toEqual({ total: 0, page: 2, limit: 5, totalPages: 0 });
                expect(mockNoticiaRepository.findAndCount).toHaveBeenCalledWith(
                    expect.objectContaining({ skip: 5, take: 5 }),
                );
            });
        });

        describe('dado o parâmetro search', () => {
            it('então deve filtrar por título ou descrição', async () => {
                mockNoticiaRepository.findAndCount.mockResolvedValueOnce([[], 0]);

                await request(app.getHttpServer())
                    .get('/noticias?search=eleicoes')
                    .expect(200);

                expect(mockNoticiaRepository.findAndCount).toHaveBeenCalledWith(
                    expect.objectContaining({
                        where: [
                            { titulo: expect.anything() },
                            { descricao: expect.anything() },
                        ],
                    }),
                );
            });
        });

        describe('dado que a mesma consulta é feita duas vezes seguidas', () => {
            it('então a segunda chamada deve vir do cache, sem consultar o repositório de novo', async () => {
                const noticias = [{ id: 'id-1', titulo: 'A', descricao: 'B' }];
                mockNoticiaRepository.findAndCount.mockResolvedValueOnce([noticias, 1]);

                const first = await request(app.getHttpServer()).get('/noticias').expect(200);
                const second = await request(app.getHttpServer()).get('/noticias').expect(200);

                expect(second.body).toEqual(first.body);
                expect(mockNoticiaRepository.findAndCount).toHaveBeenCalledTimes(1);
            });
        });

        describe('dado que uma noticia é criada após a listagem estar em cache', () => {
            it('então a próxima listagem deve buscar dados atualizados no repositório', async () => {
                mockNoticiaRepository.findAndCount.mockResolvedValueOnce([[], 0]);
                await request(app.getHttpServer()).get('/noticias').expect(200);

                await request(app.getHttpServer())
                    .post('/noticias')
                    .send({ titulo: 'Nova', descricao: 'Notícia nova' })
                    .expect(201);

                mockNoticiaRepository.findAndCount.mockResolvedValueOnce([
                    [{ id: 'id-2', titulo: 'Nova', descricao: 'Notícia nova' }],
                    1,
                ]);
                await request(app.getHttpServer()).get('/noticias').expect(200);

                expect(mockNoticiaRepository.findAndCount).toHaveBeenCalledTimes(2);
            });
        });
    });

    describe('GET /noticias/:id', () => {
        describe('dado um id existente', () => {
            it('então deve retornar a noticia com status 200', async () => {
                const noticia = { id: 'id-1', titulo: 'A', descricao: 'B' };
                mockNoticiaRepository.findOneBy.mockResolvedValueOnce(noticia);

                const response = await request(app.getHttpServer())
                    .get('/noticias/id-1')
                    .expect(200);

                expect(response.body).toEqual(noticia);
                expect(mockNoticiaRepository.findOneBy).toHaveBeenCalledWith({ id: 'id-1' });
            });
        });

        describe('dado um id inexistente', () => {
            it('então deve retornar status 404', async () => {
                mockNoticiaRepository.findOneBy.mockResolvedValueOnce(null);

                await request(app.getHttpServer())
                    .get('/noticias/id-inexistente')
                    .expect(404);
            });
        });
    });

    describe('PATCH /noticias/:id', () => {
        describe('dado um id existente e payload válido', () => {
            it('então deve atualizar e retornar a noticia com status 200', async () => {
                const noticiaExistente = { id: 'id-1', titulo: 'A', descricao: 'B' };
                mockNoticiaRepository.findOneBy.mockResolvedValueOnce(noticiaExistente);
                mockNoticiaRepository.save.mockResolvedValueOnce({
                    ...noticiaExistente,
                    titulo: 'Título atualizado',
                });

                const response = await request(app.getHttpServer())
                    .patch('/noticias/id-1')
                    .send({ titulo: 'Título atualizado' })
                    .expect(200);

                expect(response.body.titulo).toBe('Título atualizado');
            });
        });

        describe('dado um id inexistente', () => {
            it('então deve retornar status 404 sem chamar save', async () => {
                mockNoticiaRepository.findOneBy.mockResolvedValueOnce(null);

                await request(app.getHttpServer())
                    .patch('/noticias/id-inexistente')
                    .send({ titulo: 'Título atualizado' })
                    .expect(404);

                expect(mockNoticiaRepository.save).not.toHaveBeenCalled();
            });
        });
    });

    describe('DELETE /noticias/:id', () => {
        describe('dado um id existente', () => {
            it('então deve remover a noticia com status 200', async () => {
                const noticiaExistente = { id: 'id-1', titulo: 'A', descricao: 'B' };
                mockNoticiaRepository.findOneBy.mockResolvedValueOnce(noticiaExistente);
                mockNoticiaRepository.remove.mockResolvedValueOnce(undefined);

                await request(app.getHttpServer())
                    .delete('/noticias/id-1')
                    .expect(200);

                expect(mockNoticiaRepository.remove).toHaveBeenCalledWith(noticiaExistente);
            });
        });

        describe('dado um id inexistente', () => {
            it('então deve retornar status 404 sem chamar remove', async () => {
                mockNoticiaRepository.findOneBy.mockResolvedValueOnce(null);

                await request(app.getHttpServer())
                    .delete('/noticias/id-inexistente')
                    .expect(404);

                expect(mockNoticiaRepository.remove).not.toHaveBeenCalled();
            });
        });
    });
});