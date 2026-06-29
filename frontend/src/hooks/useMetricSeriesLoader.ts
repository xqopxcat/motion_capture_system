export function useMetricSeriesLoader() {
  // TODO: Sprint 1+ loads Metric Series into hook or engine memory, never Redux.
  return {
    metricSeries: null,
    isMetricSeriesLoading: false,
  } as const;
}
