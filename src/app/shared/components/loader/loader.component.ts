import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loader',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loader-overlay">
      <mat-progress-spinner color="primary" mode="indeterminate"></mat-progress-spinner>
    </div>
  `,
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {} 