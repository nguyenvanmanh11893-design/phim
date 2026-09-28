import { Link } from 'react-router';
import './Breadcrumbs.css';

export default function Breadcrumbs({ items = [] }) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs-wrapper" aria-label="Breadcrumb">
      <div className="container">
        <ol className="breadcrumbs-list">
          <li className="breadcrumbs-item">
            <Link to="/" className="breadcrumbs-link">
              <span>🏠</span>
              <span>Trang chủ</span>
            </Link>
          </li>

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={index} className="breadcrumbs-item">
                <span className="breadcrumbs-separator">›</span>
                {isLast || !item.to ? (
                  <span className="breadcrumbs-current" title={item.label}>
                    {item.label}
                  </span>
                ) : (
                  <Link to={item.to} className="breadcrumbs-link">
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
