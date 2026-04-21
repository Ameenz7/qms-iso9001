import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Capa } from '../../entities/capa.entity';
import { NonConformity } from '../../entities/non-conformity.entity';
import { NonConformitiesController } from './non-conformities.controller';
import { NonConformitiesService } from './non-conformities.service';

@Module({
  imports: [TypeOrmModule.forFeature([NonConformity, Capa])],
  controllers: [NonConformitiesController],
  providers: [NonConformitiesService],
})
export class NonConformitiesModule {}
