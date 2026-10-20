import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: false,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input() totalCount = 0;
  @Input() PageSize = 3;
  @Input() currentPage = 1;

  @Output() pageChanged: EventEmitter<number> = new EventEmitter<number>();

  onPageChanged(event: { page: number }): void {
    this.pageChanged.emit(event.page);
  }
}
