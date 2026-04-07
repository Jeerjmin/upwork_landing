interface HeaderProps {
  logoPrefix: string;
  logoHighlight: string;
  logoSuffix: string;
}

export function Header({
  logoPrefix,
  logoHighlight,
  logoSuffix,
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
        </div>
      </div>
    </header>
  );
}
