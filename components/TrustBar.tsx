type TrustIcon = "check" | "bolt" | "clock";
type TrustColor = "green" | "amber" | "blue";

interface TrustItem {
  color: TrustColor;
  icon: TrustIcon;
  title: string;
  description: string;
}

interface TrustBarProps {
  items: ReadonlyArray<TrustItem>;
}

function TrustBarIcon({ icon }: { icon: TrustIcon }) {
  if (icon === "check") {
    return (
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="#5DCAA5"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (icon === "bolt") {
    return (
      <svg
        width="14"
        height="14"
        fill="none"
        stroke="#EF9F27"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }

  return (
    <svg
      width="14"
      height="14"
      fill="none"
      stroke="#85B7EB"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export function TrustBar({ items }: TrustBarProps) {
  return (
    <div className="trust-bar">
      <div className="wrap">
        <div className="trust-inner">
          {items.map((item) => (
            <div className="trust-item" key={item.title}>
              <div className={`trust-icon ${item.color}`}>
                <TrustBarIcon icon={item.icon} />
              </div>
              <div className="trust-text">
                <strong>{item.title}</strong>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
