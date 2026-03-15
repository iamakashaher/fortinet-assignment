import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, shareReplay } from 'rxjs';
import { FieldType, FormField } from '../../core/models/form-builder.models';
import { FormStateService } from '../../core/services/form-state.service';
import { DynamicField } from './dynamic-field/dynamic-field.component';

const PHONE_PATTERN = /^\+?[\d\s\-().]{7,20}$/;
const URL_PATTERN = /^https?:\/\/.+/;
const INTEGER_PATTERN = /^-?\d+$/;
const DECIMAL_PATTERN = /^-?\d+(\.\d+)?$/;

const ERROR_MESSAGES: Partial<Record<FieldType, string>> = {
  email: 'Please enter a valid email address.',
  phone: 'Please enter a valid phone number.',
  url: 'Please enter a valid URL (must start with http:// or https://).',
  integer: 'Please enter a whole number.',
  decimal: 'Please enter a valid number.',
};

function validatorsForType(field: FormField): ValidatorFn[] {
  const validators: ValidatorFn[] = [];
  if (field.required) validators.push(Validators.required);
  switch (field.type as FieldType) {
    case 'email':   validators.push(Validators.email); break;
    case 'phone':   validators.push(Validators.pattern(PHONE_PATTERN)); break;
    case 'url':     validators.push(Validators.pattern(URL_PATTERN)); break;
    case 'integer': validators.push(Validators.pattern(INTEGER_PATTERN)); break;
    case 'decimal': validators.push(Validators.pattern(DECIMAL_PATTERN)); break;
  }
  return validators;
}

@Component({
  selector: 'app-record-form',
  imports: [AsyncPipe, ReactiveFormsModule, RouterLink, DynamicField],
  templateUrl: './record-form.component.html',
  styleUrl: './record-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecordForm {
  protected readonly formState = inject(FormStateService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  private readonly submittedSubject = new BehaviorSubject<boolean>(false);
  private readonly formSubject = new BehaviorSubject<FormGroup>(this.fb.group({}));

  readonly state$ = combineLatest({
    fields: this.formState.fields$,
    hasFields: this.formState.hasFields$,
    form: this.formSubject.asObservable(),
    submitted: this.submittedSubject.asObservable(),
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  constructor() {
    this.formState.fields$.pipe(takeUntilDestroyed()).subscribe((fields) => {
      const controls: Record<string, unknown> = {};
      for (const field of fields) {
        controls[field.id] = ['', validatorsForType(field)];
      }
      this.formSubject.next(this.fb.group(controls));
      this.submittedSubject.next(false);
    });
  }

  onSubmit(): void {
    this.submittedSubject.next(true);
    const form = this.formSubject.getValue();
    if (form.valid) {
      this.formState.submitRecord(form.value as Record<string, unknown>);
      this.router.navigateByUrl('/records');
    }
  }

  isInvalid(form: FormGroup, fieldId: string, submitted: boolean): boolean {
    return !!form.get(fieldId)?.invalid && submitted;
  }

  getError(form: FormGroup, field: FormField): string {
    const errors = form.get(field.id)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'This field is required.';
    if (errors['email']) return 'Please enter a valid email address.';
    if (errors['pattern']) return ERROR_MESSAGES[field.type] ?? 'Invalid value.';
    return 'Invalid value.';
  }
}
