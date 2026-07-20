'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Server AI', description: 'Cloud engine' },
    { href: '/local', label: 'Local AI', description: 'Browser engine' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-brand">
          <span className="brand-icon">♟</span>
          <span className="brand-text">Chess Assistant</span>
          <span className="brand-badge">PRO</span>
        </Link>

        <div className="navbar-links">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`navbar-link ${isActive ? 'active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="link-label">{item.label}</span>
                <span className="link-desc">{item.description}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
