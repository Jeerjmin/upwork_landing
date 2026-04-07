export interface ScrollMetrics {
  scrollTop: number;
  clientHeight: number;
  scrollHeight: number;
}

export const FOLLOW_BOTTOM_THRESHOLD_PX = 96;

export function getDistanceToBottom(metrics: ScrollMetrics): number {
  return Math.max(
    metrics.scrollHeight - metrics.clientHeight - metrics.scrollTop,
    0,
  );
}

export function isNearBottom(
  metrics: ScrollMetrics,
  threshold = FOLLOW_BOTTOM_THRESHOLD_PX,
): boolean {
  return getDistanceToBottom(metrics) <= threshold;
}
