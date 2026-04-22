import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_PIPE } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationPipe } from '@nestjs/common';
import { CsrfMiddleware } from './common/middleware/csrf.middleware';
import { AuditLog } from './entities/audit-log.entity';
import { Capa } from './entities/capa.entity';
import { DocumentAttachment } from './entities/document-attachment.entity';
import { DocumentVersion } from './entities/document-version.entity';
import { QmsDocument } from './entities/document.entity';
import { NonConformity } from './entities/non-conformity.entity';
import { Organization } from './entities/organization.entity';
import { Payment } from './entities/payment.entity';
import { UserInvite } from './entities/user-invite.entity';
import { User } from './entities/user.entity';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { CapasModule } from './modules/capas/capas.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { InvitesModule } from './modules/invites/invites.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { NonConformitiesModule } from './modules/non-conformities/non-conformities.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { SeedModule } from './modules/seed/seed.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: parseInt(config.get<string>('DB_PORT') ?? '5432', 10),
        username: config.get<string>('DB_USER') ?? 'qms',
        password: config.get<string>('DB_PASSWORD') ?? 'qms',
        database: config.get<string>('DB_NAME') ?? 'qms',
        entities: [
          User,
          UserInvite,
          Organization,
          Payment,
          QmsDocument,
          DocumentVersion,
          DocumentAttachment,
          NonConformity,
          Capa,
          AuditLog,
        ],
        synchronize: true,
      }),
    }),
    MailerModule,
    StorageModule,
    AuditModule,
    AuthModule,
    UsersModule,
    InvitesModule,
    OrganizationsModule,
    NonConformitiesModule,
    CapasModule,
    DocumentsModule,
    SeedModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
