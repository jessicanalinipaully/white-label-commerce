import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { AddDomainDto } from './dto/add-domain.dto';
import { AddStoreUserDto } from './dto/add-store-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createStore(@Body() dto: CreateStoreDto, @Request() req) {
    return this.storeService.createStore(dto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('slug/:slug')
  async getBySlug(@Param('slug') slug: string) {
    return this.storeService.findStoreBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.storeService.findStoreById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/domains')
  async addDomain(@Param('id') id: string, @Body() dto: AddDomainDto) {
    return this.storeService.addDomain(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/users')
  async addStoreUser(@Param('id') id: string, @Body() dto: AddStoreUserDto) {
    return this.storeService.addStoreUser(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/users')
  async listMemberships(@Param('id') id: string) {
    return this.storeService.listStoreMemberships(id);
  }
}
