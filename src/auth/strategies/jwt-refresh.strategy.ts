import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refresh_token'), // ← extract from JSON body
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.body.refresh_token;
    if (!refreshToken) throw new UnauthorizedException('No refresh token found');
    return { ...payload, refreshToken }; // available in req.user
  }
}
