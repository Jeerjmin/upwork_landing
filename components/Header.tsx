interface HeaderProps {
  logoPrefix: string;
  logoHighlight: string;
  logoSuffix: string;
  upworkLabel: string;
  upworkUrl: string;
}

export function Header({
  logoPrefix,
  logoHighlight,
  logoSuffix,
  upworkLabel,
  upworkUrl,
}: HeaderProps) {
  return (
    <header>
      <div className="wrap">
        <div className="header-inner">
          <div className="logo">
            {logoPrefix}
            <b>{logoHighlight}</b>
            {logoSuffix}
          </div>
          <a
            href={upworkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-upwork"
          >
            {upworkLabel}
          </a>
        </div>
      </div>
    </header>
  );
}
