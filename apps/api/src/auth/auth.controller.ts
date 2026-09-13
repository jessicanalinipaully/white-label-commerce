import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthResponse, TenantContext } from '@commerce/types';
import { StoreService } from '../store/store.service';
import { CurrentTenant } from '../tenant/tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly storeService: StoreService,
  ) {}

  @Post('register')
  async register(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: RegisterDto,
  ): Promise<AuthResponse> {
    return this.authService.register(dto, tenant);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: LoginDto,
  ): Promise<AuthResponse> {
    return this.authService.login(dto, tenant);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Request() req) {
    const memberships = await this.storeService.getUserMemberships(req.user.id);
    return {
      ...req.user,
      stores: memberships.map((m) => ({
        id: m.store.id,
        name: m.store.name,
        slug: m.store.slug,
        role: m.role,
      })),
    };
  }
}
