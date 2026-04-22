import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Capa } from '../../entities/capa.entity';
import { CapaSubtask } from '../../entities/capa-subtask.entity';
import { NonConformity } from '../../entities/non-conformity.entity';
import { User } from '../../entities/user.entity';
import { CapasController } from './capas.controller';
import { CapasService } from './capas.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Capa, CapaSubtask, NonConformity, User]),
  ],
  controllers: [CapasController],
  providers: [CapasService],
  exports: [CapasService],
})
export class CapasModule {}
