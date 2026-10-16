/**
 * AFTER: Recharts (a heavy library) is loaded ONLY when the analytics panel is opened.
 * Suspense here wraps just this one component, with its own small fallback.
 */
import { Suspense } from 'react';
import { lazyWithDelay } from '../../utils/lazyWithDelay';

const TaskChart = lazyWithDelay(() => import('./TaskChart'));

export default function ChartEntry({ tasks }) {
  return (
    <Suspense
      fallback={
        <div className="chart-grid" role="status" aria-label="Loading charts">
          <div className="skeleton skeleton-chart" />
          <div className="skeleton skeleton-chart" />
        </div>
      }
    >
      <TaskChart tasks={tasks} />
    </Suspense>
  );
}
