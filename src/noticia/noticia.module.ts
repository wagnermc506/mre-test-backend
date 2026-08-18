import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Noticia } from './entities/noticia.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Noticia])],
  exports: [TypeOrmModule],
})
export class NoticiaModule {}