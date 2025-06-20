import { 
    Controller,
    Post,
    Body,
    Req,
    Put,
    Param
 } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { LoginAuthDto } from './dto/login-auth.dto';


@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}

    @Post('register')
    register(@Body() data: CreateAuthDto){
        return this.authService.create(data)
    }

    @Post('login')
    loginClient(@Body() data: LoginAuthDto) {
        return this.authService.loginClient(data);
    }

    @Post('verify')
    verifyClient(@Req() request: Request) {
      return this.authService.verify(request);
    }

    @Post('register/client')
    registerClient(@Body() data: CreateAuthDto) {
      return this.authService.createClient(data);
    }

    @Put(':id/password')
    async changePassword(
      @Param('id') id: string,
      @Body('currentPassword') currentPassword: string,
      @Body('newPassword') newPassword: string,
    ) {
      return this.authService.changePassword(id, currentPassword, newPassword);
    }
}
