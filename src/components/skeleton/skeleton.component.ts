import { Component, Input } from '@angular/core';

/**
 * Placeholder shapes shown while a screen's data loads, in place of the old
 * full-screen loader. Pick the variant that matches the content it stands in for:
 *   rows   - list rows with an avatar (clients, notifications, alerts)
 *   cards  - a grid of small cards (activities)
 *   fields - form fields in two columns (settings)
 *   lines  - lines of text (chat, comments, policy text)
 */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.component.html',
  styleUrls: ['./skeleton.component.css']
})
export class SkeletonComponent {
  @Input() variant: 'rows' | 'cards' | 'fields' | 'lines' = 'rows';
  @Input() count = 3;
  /** Smaller rows, for narrow side panels. */
  @Input() compact = false;

  get items(): number[] {
    return Array.from({ length: this.count }, (_, i) => i);
  }

  /** Varied widths so text placeholders don't look like a ruled grid. */
  lineWidth(i: number): string {
    return ['92%', '78%', '85%', '64%', '88%', '71%'][i % 6];
  }
}
