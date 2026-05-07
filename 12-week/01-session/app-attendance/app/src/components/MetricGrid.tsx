type MetricItem = {
  label: string;
  value: string | number;
  variant?: "success" | "danger" | "warning" | "neutral" | "primary";
};

type MetricGridProps = {
  metrics: MetricItem[];
};

export function MetricGrid({ metrics }: MetricGridProps) {
  return (
    <div className="metric-grid">
      {metrics.map((metric) => (
        <div
          className={`metric${metric.variant ? ` metric-${metric.variant}` : ""}`}
          key={metric.label}
        >
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </div>
      ))}
    </div>
  );
}

