interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  note: string;
  links: ReadonlyArray<FooterLink>;
}

export function Footer({ note, links }: FooterProps) {
  return (
    <footer>
      <div className="wrap">
        <div className="foot-inner">
          <span className="foot-note">{note}</span>
          <nav className="foot-links">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
