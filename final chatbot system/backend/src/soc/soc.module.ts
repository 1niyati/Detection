import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocService } from './soc.service';
import { SocController } from './soc.controller';
import { LoginActivity } from './entities/login-activity.entity';
import { SocUser } from './entities/soc-user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoginActivity, SocUser], 'applicationConnection'),
  ],
  controllers: [SocController],
  providers: [SocService],
  exports: [SocService], // Make the service available to other modules
})
export class SocModule {}
