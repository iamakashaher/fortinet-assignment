import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, combineLatest, map, shareReplay } from 'rxjs';
import { FormField } from '../../core/models/form-builder.models';
import { FormRecord } from '../../core/models/form-builder.models';
import { FormStateService } from '../../core/services/form-state.service';

type SortDir = 'asc' | 'desc';

const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

interface PaginationInfo {
  start: number;
  end: number;
  total: number;
}

interface GridState {
  columns: FormField[];
  totalRows: number;
  pagedRows: FormRecord[];
  paginationInfo: PaginationInfo;
  pageNumbers: (number | null)[];
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasActiveFilters: boolean;
  clearConfirm: boolean;
  hasFields: boolean;
  sortColumn: string | null;
  sortDir: SortDir;
  columnFilters: Record<string, string>;
}

@Component({
  selector: 'app-data-grid',
  imports: [AsyncPipe, RouterLink, DatePipe],
  templateUrl: './data-grid.component.html',
  styleUrl: './data-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataGrid {
  private readonly formState = inject(FormStateService);

  readonly pageSizeOptions = PAGE_SIZE_OPTIONS;

  private readonly columnFiltersSubject = new BehaviorSubject<Record<string, string>>({});
  private readonly sortColumnSubject = new BehaviorSubject<string | null>(null);
  private readonly sortDirSubject = new BehaviorSubject<SortDir>('asc');
  private readonly pageSizeSubject = new BehaviorSubject<number>(10);
  private readonly currentPageSubject = new BehaviorSubject<number>(1);
  private readonly clearConfirmSubject = new BehaviorSubject<boolean>(false);

  private readonly filteredRows$ = combineLatest([
    this.formState.records$,
    this.formState.fields$,
    this.columnFiltersSubject,
  ]).pipe(
    map(([rows, columns, filters]) => {
      const validColIds = new Set(['submittedAt', ...columns.map((column) => column.id)]);
      return rows.filter((row) =>
        Object.entries(filters).every(([colId, term]) => {
          const trimmed = term.trim();
          if (!trimmed || !validColIds.has(colId)) return true;
          const cell =
            colId === 'submittedAt'
              ? this.formatDateForSearch(row.submittedAt)
              : this.getCellValue(row.data, colId);
          return cell.toLowerCase().includes(trimmed.toLowerCase());
        }),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly sortedRows$ = combineLatest([
    this.filteredRows$,
    this.sortColumnSubject,
    this.sortDirSubject,
    this.formState.fields$,
  ]).pipe(
    map(([rows, sortCol, sortDir, columns]) => {
      if (!sortCol) return rows;
      const colType = sortCol === 'submittedAt'
        ? 'datetime'
        : (columns.find((column) => column.id === sortCol)?.type ?? 'text');

      return [...rows].sort((a, b) => {
        const aRaw = sortCol === 'submittedAt' ? a.submittedAt : this.getCellValue(a.data, sortCol);
        const bRaw = sortCol === 'submittedAt' ? b.submittedAt : this.getCellValue(b.data, sortCol);

        if (colType === 'integer' || colType === 'decimal') {
          const aNum = parseFloat(aRaw);
          const bNum = parseFloat(bRaw);
          if (!isNaN(aNum) && !isNaN(bNum)) return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const cmp = aRaw.toLowerCase().localeCompare(bRaw.toLowerCase());
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly totalPages$ = combineLatest([this.sortedRows$, this.pageSizeSubject]).pipe(
    map(([sortedRows, pageSize]) => (pageSize === 0 ? 1 : Math.max(1, Math.ceil(sortedRows.length / pageSize)))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly pagedRows$ = combineLatest([
    this.sortedRows$,
    this.pageSizeSubject,
    this.currentPageSubject,
    this.totalPages$,
  ]).pipe(
    map(([sortedRows, pageSize, currentPage, totalPages]) => {
      if (pageSize === 0) return sortedRows;
      const safePage = Math.min(currentPage, totalPages);
      return sortedRows.slice((safePage - 1) * pageSize, safePage * pageSize);
    }),
  );

  private readonly paginationInfo$ = combineLatest([
    this.sortedRows$,
    this.pageSizeSubject,
    this.currentPageSubject,
    this.totalPages$,
  ]).pipe(
    map(([sortedRows, pageSize, currentPage, totalPages]): PaginationInfo => {
      const total = sortedRows.length;
      if (total === 0) return { start: 0, end: 0, total: 0 };
      if (pageSize === 0) return { start: 1, end: total, total };
      const safePage = Math.min(currentPage, totalPages);
      return { start: (safePage - 1) * pageSize + 1, end: Math.min(safePage * pageSize, total), total };
    }),
  );

  private readonly pageNumbers$ = combineLatest([this.totalPages$, this.currentPageSubject]).pipe(
    map(([totalPages, currentPage]): (number | null)[] => {
      const safePage = Math.min(currentPage, totalPages);
      if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
      const pages: (number | null)[] = [1];
      if (safePage > 3) pages.push(null);
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push(null);
      pages.push(totalPages);
      return pages;
    }),
  );

  private readonly hasActiveFilters$ = this.columnFiltersSubject.pipe(
    map((filters) => Object.values(filters).some((filterValue) => filterValue.trim() !== '')),
  );

  readonly state$ = combineLatest({
    columns: this.formState.fields$,
    totalRows: this.formState.records$.pipe(map((records) => records.length)),
    pagedRows: this.pagedRows$,
    paginationInfo: this.paginationInfo$,
    pageNumbers: this.pageNumbers$,
    totalPages: this.totalPages$,
    currentPage: this.currentPageSubject.asObservable(),
    pageSize: this.pageSizeSubject.asObservable(),
    hasActiveFilters: this.hasActiveFilters$,
    clearConfirm: this.clearConfirmSubject.asObservable(),
    hasFields: this.formState.hasFields$,
    sortColumn: this.sortColumnSubject.asObservable(),
    sortDir: this.sortDirSubject.asObservable(),
    columnFilters: this.columnFiltersSubject.asObservable(),
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  setSort(colId: string): void {
    if (this.sortColumnSubject.getValue() === colId) {
      this.sortDirSubject.next(this.sortDirSubject.getValue() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumnSubject.next(colId);
      this.sortDirSubject.next('asc');
    }
    this.currentPageSubject.next(1);
  }

  getSortIcon(colId: string, sortColumn: string | null, sortDir: SortDir): string {
    if (sortColumn !== colId) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  }

  getSortAria(colId: string, sortColumn: string | null, sortDir: SortDir): string | null {
    if (sortColumn !== colId) return null;
    return sortDir === 'asc' ? 'ascending' : 'descending';
  }

  setFilter(colId: string, value: string): void {
    this.columnFiltersSubject.next({ ...this.columnFiltersSubject.getValue(), [colId]: value });
    this.currentPageSubject.next(1);
  }

  clearFilters(): void {
    this.columnFiltersSubject.next({});
    this.currentPageSubject.next(1);
  }

  getFilterValue(filters: Record<string, string>, colId: string): string {
    return filters[colId] ?? '';
  }

  goToPage(page: number, totalPages: number): void {
    this.currentPageSubject.next(Math.max(1, Math.min(page, totalPages)));
  }

  setPageSize(size: number): void {
    this.pageSizeSubject.next(size);
    this.currentPageSubject.next(1);
  }

  confirmClear(): void {
    this.clearConfirmSubject.next(true);
  }

  cancelClear(): void {
    this.clearConfirmSubject.next(false);
  }

  executeClear(): void {
    this.formState.clearRecords();
    this.clearConfirmSubject.next(false);
    this.columnFiltersSubject.next({});
    this.sortColumnSubject.next(null);
    this.currentPageSubject.next(1);
  }

  getCellValue(data: Record<string, unknown>, colId: string): string {
    const val = data[colId];
    if (val === undefined || val === null || val === '') return '—';
    return String(val);
  }

  private formatDateForSearch(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }
}
