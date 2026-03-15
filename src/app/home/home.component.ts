import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { combineLatest, map, shareReplay } from 'rxjs';
import { FormStateService } from '../core/services/form-state.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AsyncPipe],
})
export class Home {
  private readonly formState = inject(FormStateService);

  readonly state$ = combineLatest({
    fieldCount: this.formState.fields$.pipe(map((fields) => fields.length)),
    recordCount: this.formState.records$.pipe(map((records) => records.length)),
    hasFields: this.formState.hasFields$,
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
