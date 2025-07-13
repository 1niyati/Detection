import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocController } from './soc.controller';
import { SocService } from './soc.service';
import { LoginActivity } from './entities/login-activity.entity';
import { SocUser } from './entities/soc-user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LoginActivity, SocUser], 'applicationConnection')],
  controllers: [SocController],
  providers: [SocService],
})
export class SocModule {}
