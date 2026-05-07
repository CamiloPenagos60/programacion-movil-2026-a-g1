import { IonSkeletonText } from "@ionic/react";

export function SkeletonMetricGrid() {
  return (
    <div className="skeleton-metric-grid">
      {[0, 1, 2].map((i) => (
        <div className="skeleton-metric" key={i}>
          <IonSkeletonText animated style={{ width: "100%", height: "100%" }} />
        </div>
      ))}
    </div>
  );
}
