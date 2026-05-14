import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { AuthService } from '../../core/auth.service';
import { DashboardService } from '../../core/dashboard.service';
import { DashboardStats, TaskItem } from '../../core/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatButtonModule,
    MatChipsModule,
  ],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1>Welcome, {{ user()?.firstName }}</h1>
          <div class="subtitle">Here's what's happening in your QMS today.</div>
        </div>
      </div>

      <div class="kpi-grid">
        <mat-card class="kpi nc">
          <div class="label">Open NCs</div>
          <div class="value">{{ stats()?.ncOpen ?? 0 }}</div>
          <div class="footnote">
            {{ stats()?.ncInProgress ?? 0 }} in progress · {{ stats()?.ncClosed ?? 0 }} closed
          </div>
        </mat-card>
        <mat-card class="kpi docs">
          <div class="label">Documents in review</div>
          <div class="value">{{ stats()?.docsReview ?? 0 }}</div>
          <div class="footnote">
            {{ stats()?.docsDraft ?? 0 }} drafts · {{ stats()?.docsApproved ?? 0 }} approved
          </div>
        </mat-card>
        <mat-card class="kpi audits">
          <div class="label">Audits planned</div>
          <div class="value">{{ stats()?.auditsPlanned ?? 0 }}</div>
          <div class="footnote">
            {{ stats()?.auditsCompleted ?? 0 }} completed this period
          </div>
        </mat-card>
        <mat-card class="kpi actions">
          <div class="label">Actions pending</div>
          <div class="value">{{ stats()?.actionsPending ?? 0 }}</div>
          <div class="footnote" [class.warn]="(stats()?.actionsOverdue ?? 0) > 0">
            {{ stats()?.actionsOverdue ?? 0 }} overdue
          </div>
        </mat-card>
      </div>

      <div class="grid-2">
        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Non-Conformities by status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #ncChart></canvas>
          </mat-card-content>
        </mat-card>

        <mat-card class="chart-card">
          <mat-card-header>
            <mat-card-title>Documents by status</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <canvas #docChart></canvas>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card>
        <mat-card-header>
          <mat-card-title>My tasks</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="tasks().length === 0" class="empty-state">
            <mat-icon>check_circle</mat-icon>
            <div>No pending tasks. Nice work!</div>
          </div>
          <mat-list *ngIf="tasks().length > 0">
            <mat-list-item *ngFor="let t of tasks()" [routerLink]="t.link">
              <mat-icon matListItemIcon>{{ iconFor(t.kind) }}</mat-icon>
              <span matListItemTitle>{{ t.title }}</span>
              <span matListItemLine>
                <span class="kind-tag" [class]="'kind-' + t.kind.toLowerCase()">{{ t.kind }}</span>
                <span *ngIf="t.dueDate"> · Due {{ t.dueDate | date: 'mediumDate' }}</span>
              </span>
            </mat-list-item>
          </mat-list>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .kpi {
        padding: 16px 20px;
        border-left: 4px solid #4f46e5;
        .label { color: #6b7280; font-size: 13px; }
        .value { font-size: 32px; font-weight: 600; margin: 8px 0; }
        .footnote { color: #6b7280; font-size: 12px; }
        .footnote.warn { color: #b91c1c; font-weight: 500; }
      }
      .kpi.nc { border-left-color: #ef4444; }
      .kpi.docs { border-left-color: #6366f1; }
      .kpi.audits { border-left-color: #10b981; }
      .kpi.actions { border-left-color: #f59e0b; }

      .grid-2 {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .chart-card canvas { max-height: 220px; }

      .kind-tag {
        padding: 1px 8px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 500;
        margin-right: 6px;
      }
      .kind-nc { background: #fee2e2; color: #991b1b; }
      .kind-action { background: #fef3c7; color: #92400e; }
      .kind-audit { background: #d1fae5; color: #065f46; }
      .kind-document { background: #dbeafe; color: #1e40af; }
    `,
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private dashboard = inject(DashboardService);
  private auth = inject(AuthService);

  @ViewChild('ncChart') ncChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('docChart') docChartRef!: ElementRef<HTMLCanvasElement>;

  user = this.auth.user;
  stats = signal<DashboardStats | null>(null);
  tasks = signal<TaskItem[]>([]);

  ngOnInit(): void {
    this.dashboard.stats().subscribe((s) => {
      this.stats.set(s);
      queueMicrotask(() => this.renderCharts());
    });
    this.dashboard.myTasks().subscribe((t) => this.tasks.set(t));
  }

  ngAfterViewInit(): void {
    if (this.stats()) this.renderCharts();
  }

  iconFor(kind: TaskItem['kind']): string {
    switch (kind) {
      case 'NC':
        return 'report_problem';
      case 'ACTION':
        return 'task_alt';
      case 'AUDIT':
        return 'fact_check';
      default:
        return 'description';
    }
  }

  private renderCharts(): void {
    const s = this.stats();
    if (!s) return;
    if (this.ncChartRef?.nativeElement) {
      new Chart(this.ncChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Open', 'In progress', 'Closed'],
          datasets: [
            {
              data: [s.ncOpen, s.ncInProgress, s.ncClosed],
              backgroundColor: ['#3b82f6', '#a78bfa', '#10b981'],
            },
          ],
        },
        options: { plugins: { legend: { position: 'bottom' } } },
      });
    }
    if (this.docChartRef?.nativeElement) {
      new Chart(this.docChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: ['Draft', 'Review', 'Approved'],
          datasets: [
            {
              label: 'Documents',
              data: [s.docsDraft, s.docsReview, s.docsApproved],
              backgroundColor: ['#94a3b8', '#a78bfa', '#10b981'],
            },
          ],
        },
        options: {
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }
  }
}
