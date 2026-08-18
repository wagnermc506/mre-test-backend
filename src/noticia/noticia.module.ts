import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Noticia } from './entities/noticia.entity';
import { NoticiaController } from './noticia.controller';
import { NoticiaService } from './noticia.service';

@Module({
  imports: [TypeOrmModule.forFeature([Noticia])],
  controllers: [NoticiaController],
  providers: [NoticiaService],
})
export class NoticiaModule {}
