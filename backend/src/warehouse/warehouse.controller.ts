import { 
    Controller,
    Post,
    Body,
    Param,
    Put,
    Get,
    Req,
 } from '@nestjs/common';
import { CreateWareHourehDto } from './dto/create-wareHoure.dto';
import { WarehouseService } from './warehouse.service';
import { Request } from 'express';
import getBearerToken from 'src/methods/getBearerToken';
import * as jwt from 'jsonwebtoken';
import { JwtPayload } from 'jsonwebtoken';
@Controller('warehouse')
export class WarehouseController {
    constructor(private readonly warehouseService:WarehouseService){}

    private extractUserId(req: Request): string | undefined {
        try {
            const token = getBearerToken(req);
            if (!token) return undefined;
            const login = jwt.verify(token, process.env.SECRET_KEY) as JwtPayload;
            return String(login.id);
        } catch {
            return undefined;
        }
    }

    @Post('create')
    create(@Body() data: CreateWareHourehDto, @Req() req: Request){
        const userId = this.extractUserId(req);
        return this.warehouseService.create(data, userId);
    }

    @Post('delete/:id')
    delete(@Param('id') id: string, @Req() req: Request){
        const userId = this.extractUserId(req);
        return this.warehouseService.deleteById(id, userId);
    }

    @Put(':id')
    async updateWarehouse(@Param('id') id: string, @Body() data: Partial<CreateWareHourehDto>, @Req() req: Request) {
        const userId = this.extractUserId(req);
        return this.warehouseService.update(id, data, userId);
    }

    @Get()
    async getAllWarehouses() {
        return this.warehouseService.findAll();
    }

    @Get('unofficially')
    async getAllWarehousesUnofficially() {
        return this.warehouseService.findAllUnofficially();
    }

    @Get('in-stock')
    async getInStock() {
        return this.warehouseService.getInStock();
    }

    @Get('in-stock-unofficially')
    async getInStockUnofficially() {
        return this.warehouseService.getInStockUnofficially();
    }

    @Get('history')
    async getAllWarehouseHistory() {
        console.log('getAllWarehouseHistory called');
        const result = await this.warehouseService.getAllHistory();
        console.log('getAllWarehouseHistory result:', result);
        return result;
    }

    @Get('history/:id')
    async getWarehouseHistory(@Param('id') id: string) {
        return this.warehouseService.getHistory(id);
    }

    @Get(':id')
    async getWarehouseById(@Param('id') id: string) {
        return this.warehouseService.getWarehouseById(id);
    }
}
