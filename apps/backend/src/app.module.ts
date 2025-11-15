import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QuranModule } from './quran/quran.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    QuranModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
