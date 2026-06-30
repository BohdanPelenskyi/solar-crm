import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { compare } from 'bcryptjs'
import { UserRole } from '../generated/prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { AuthTokenPayload } from './auth-token-payload'
import { LoginDto } from './dto/login.dto'

type SafeUser = {
  id: number
  email: string
  fullName: string
  role: UserRole
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const email = loginDto.email.trim().toLowerCase()

    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Невірний email або пароль')
    }

    const isPasswordCorrect = await compare(
      loginDto.password,
      user.passwordHash,
    )

    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Невірний email або пароль')
    }

    const payload: AuthTokenPayload = {
      sub: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    }

    const accessToken = await this.jwtService.signAsync(payload)

    return {
      accessToken,
      user: this.toSafeUser(user),
    }
  }

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Сесія недійсна')
    }

    return this.toSafeUser(user)
  }

  private toSafeUser(user: SafeUser) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    }
  }
}