import { IonButton, IonIcon } from "@ionic/react";
import { alertCircleOutline } from "ionicons/icons";

type EmptyStateProps = {
  title: string;
  detail?: string;
  icon?: string;
  action?: { label: string; onClick: () => void };
};

export function EmptyState({ title, detail, icon, action }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon-wrap">
        <IonIcon icon={icon ?? alertCircleOutline} />
      </div>
      <h2>{title}</h2>
      {detail ? <p>{detail}</p> : null}
      {action ? (
        <IonButton size="small" onClick={action.onClick}>
          {action.label}
        </IonButton>
      ) : null}
    </div>
  );
}

