import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Capa } from '../../entities/capa.entity';
import { CapasController } from './capas.controller';
import { CapasService } from './capas.service';

@Module({
  imports: [TypeOrmModule.forFeature([Capa])],
  controllers: [CapasController],
  providers: [CapasService],
})
export class CapasModule {}
