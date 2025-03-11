import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class WarehouseHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    warehouseId: string;

    @Column()
    action: string;

    @Column('json')
    data: any;

    @CreateDateColumn()
    createdAt: Date;
}