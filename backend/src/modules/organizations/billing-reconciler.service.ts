import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrganizationsService } from './organizations.service';

@Injectable()
export class BillingReconcilerService {
  private readonly logger = new Logger(BillingReconcilerService.name);

  constructor(private readonly orgs: OrganizationsService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async tick(): Promise<void> {
    try {
      const changed = await this.orgs.reconcileBillingStatuses();
      if (changed > 0) {
        this.logger.log(`Billing reconciler flipped ${changed} org status(es)`);
      }
    } catch (err) {
      this.logger.error('Billing reconciler failed', err as Error);
    }
  }
}
