import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class WarehouseHistory {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    warehouseId: string;

    // 'create' | 'update' | 'delete'
    @Column()
    action: string;

    // Snapshot of warehouse record after operation
    @Column('json')
    data: any;

    // Optional user who performed the change
    @Column({ nullable: true })
    userId?: string;

    // Optional warehouse type: 'official' | 'unofficial'
    @Column({ nullable: true })
    warehouseType?: string;

    // Quantities before/after operation (for movement tracking)
    @Column({ type: 'int', nullable: true })
    oldQuantity?: number;

    @Column({ type: 'int', nullable: true })
    newQuantity?: number;

    @CreateDateColumn()
    createdAt: Date;
}