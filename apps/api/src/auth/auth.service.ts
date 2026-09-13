import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, TenantContext } from '@commerce/types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto, tenant?: TenantContext): Promise<AuthResponse> {
    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : '';

    let firstName = dto.firstName;
    let lastName = dto.lastName;

    if (dto.name && !firstName && !lastName) {
      const parts = dto.name.trim().split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ') || undefined;
    }

    const storeId = tenant?.store?.id;

    if (storeId) {
      // 1. Check if a Customer record already exists for this store & email
      const existingCustomer = await this.prisma.customer.findFirst({
        where: {
          storeId,
          user: { email: normalizedEmail },
        },
      });

      if (existingCustomer) {
        throw new ConflictException('An account with this email already exists');
      }

      // 2. Check if a global User record exists
      let user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        // Verify password matches existing user account
        const isValid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!isValid) {
          throw new ConflictException('An account with this email already exists');
        }
      } else {
        // Create new User
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(dto.password, saltRounds);
        user = await this.prisma.user.create({
          data: {
            email: normalizedEmail,
            passwordHash,
            firstName: firstName || null,
            lastName: lastName || null,
            role: 'USER',
          },
        });
      }

      // 3. Create Customer profile for store
      await this.prisma.customer.upsert({
        where: { storeId_userId: { storeId, userId: user.id } },
        update: {
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
        },
        create: {
          storeId,
          userId: user.id,
          firstName: firstName || user.firstName,
          lastName: lastName || user.lastName,
        },
      });

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        accessToken,
        user: userWithoutPassword,
      };
    } else {
      // Global registration fallback
      const existingUser = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(dto.password, saltRounds);

      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
          role: 'USER',
        },
      });

      const payload = { sub: user.id, email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      const { passwordHash: _, ...userWithoutPassword } = user;

      return {
        accessToken,
        user: userWithoutPassword,
      };
    }
  }

  async login(dto: LoginDto, tenant?: TenantContext): Promise<AuthResponse> {
    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : '';

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const storeId = tenant?.store?.id;
    if (storeId) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { storeId_userId: { storeId, userId: user.id } },
      });

      if (!existingCustomer) {
        await this.prisma.customer.create({
          data: {
            storeId,
            userId: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
          },
        });
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      accessToken,
      user: userWithoutPassword,
    };
  }
}
