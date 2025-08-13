import { 
    Controller,
    Post,
    Body,
    Param,
    Put,
    Get
 } from '@nestjs/common';
import { CreateWareHourehDto } from './dto/create-wareHoure.dto';
import { WarehouseService } from './warehouse.service';
@Controller('warehouse')
export class WarehouseController {
    constructor(private readonly warehouseService:WarehouseService){}

    @Post('create')
    create(@Body() data: CreateWareHourehDto){
        return this.warehouseService.create(data)
    }

    @Post('delete/:id')
    delete(@Param('id') id: string){
        return this.warehouseService.deleteById(id)
    }

    @Put(':id')
    async updateWarehouse(@Param('id') id: string, @Body() data: Partial<CreateWareHourehDto>) {
        return this.warehouseService.update(id, data);
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
