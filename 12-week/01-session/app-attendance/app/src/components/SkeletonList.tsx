import { IonSkeletonText } from "@ionic/react";

type SkeletonListProps = {
  rows?: number;
};

export function SkeletonList({ rows = 5 }: SkeletonListProps) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i}>
          <div className="skeleton-avatar">
            <IonSkeletonText animated style={{ width: "36px", height: "36px", borderRadius: "50%" }} />
          </div>
          <div className="skeleton-lines">
            <IonSkeletonText animated style={{ width: "60%", height: "14px", borderRadius: "4px" }} />
            <IonSkeletonText animated style={{ width: "40%", height: "12px", borderRadius: "4px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
