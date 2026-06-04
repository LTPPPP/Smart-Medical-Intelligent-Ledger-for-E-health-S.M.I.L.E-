import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiagnosticOrdersController } from './diagnostic-orders.controller';
import { DiagnosticOrdersService } from './diagnostic-orders.service';
import { DiagnosticOrderEntity } from './entities/diagnostic-order.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiagnosticOrderEntity], 'clinicConnection'),
  ],
  controllers: [DiagnosticOrdersController],
  providers: [DiagnosticOrdersService],
  exports: [DiagnosticOrdersService],
})
export class DiagnosticOrdersModule {}
