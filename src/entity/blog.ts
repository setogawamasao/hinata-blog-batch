import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

@Entity()
export class Blogs {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  posted_by: string;

  @Column()
  posted_at: Date;

  @Column()
  title: string;

  @Column()
  url: string;
}
