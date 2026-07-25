import { useEffect, useState } from "react";

type MetricSeriesLoaderState = {
  errorMessage: string | null;
  isMetricSeriesLoading: boolean;
  metricSeries: unknown | null;
};

export function useMetricSeriesLoader(seriesUrl?: string | null): MetricSeriesLoaderState {
  const [state, setState] = useState<MetricSeriesLoaderState>({
    errorMessage: null,
    isMetricSeriesLoading: false,
    metricSeries: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function loadMetricSeries() {
      if (!seriesUrl) {
        setState({
          errorMessage: null,
          isMetricSeriesLoading: false,
          metricSeries: null,
        });
        return;
      }

      setState({
        errorMessage: null,
        isMetricSeriesLoading: true,
        metricSeries: null,
      });

      try {
        const metricSeries = await loadMetricSeriesFromUrl(seriesUrl);
        if (!cancelled) {
          setState({
            errorMessage: null,
            isMetricSeriesLoading: false,
            metricSeries,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            errorMessage: error instanceof Error ? error.message : "Metric Series could not load.",
            isMetricSeriesLoading: false,
            metricSeries: null,
          });
        }
      }
    }

    void loadMetricSeries();

    return () => {
      cancelled = true;
    };
  }, [seriesUrl]);

  return state;
}

async function loadMetricSeriesFromUrl(seriesUrl: string): Promise<unknown | null> {
  const response = await fetch(seriesUrl);
  if (!response.ok) {
    throw new Error("Metric Series request failed.");
  }

  return response.json();
}
