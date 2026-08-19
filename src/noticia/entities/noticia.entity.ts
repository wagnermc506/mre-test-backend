import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Noticia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titulo: string;

  @Column()
  descricao: string;
}
