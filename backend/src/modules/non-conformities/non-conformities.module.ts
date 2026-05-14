import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Capa } from '../../entities/capa.entity';
import { NonConformity } from '../../entities/non-conformity.entity';
import { RootCause } from '../../entities/root-cause.entity';
import { CorrectiveAction } from '../../entities/corrective-action.entity';
import { NonConformitiesController } from './non-conformities.controller';
import { NonConformitiesService } from './non-conformities.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      NonConformity,
      Capa,
      RootCause,
      CorrectiveAction,
    ]),
  ],
  controllers: [NonConformitiesController],
  providers: [NonConformitiesService],
})
export class NonConformitiesModule {}
