import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AuthGoogleController } from './auth-google.controller';
import { AuthGoogleService } from './auth-google.service';

@Module({
  imports: [AuthModule],
  controllers: [AuthGoogleController],
  providers: [AuthGoogleService],
  exports: [AuthGoogleService],
})
export class AuthGoogleModule {}
