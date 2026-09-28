import { Link } from 'react-router';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <div className="footer-brand-title">
              Cine<span>Booking</span>
            </div>
            <p className="footer-desc">
              Nền tảng đặt vé xem phim trực tuyến hiện đại. Cập nhật lịch chiếu nhanh chóng,
              chọn ghế tiện lợi và trải nghiệm điện ảnh chuẩn rạp.
            </p>
          </div>

          {/* Navigation Col */}
          <div>
            <h4 className="footer-heading">Điều hướng</h4>
            <ul className="footer-links">
              <li>
                <Link to="/" className="footer-link">
                  Trang chủ
                </Link>
              </li>
              <li>
                <Link to="/movies" className="footer-link">
                  Phim đang & sắp chiếu
                </Link>
              </li>
              <li>
                <Link to="/cinemas" className="footer-link">
                  Hệ thống rạp chiếu
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Col - Per yeucau.txt: không tự bịa địa chỉ hoặc số điện thoại */}
          <div>
            <h4 className="footer-heading">Thông tin liên hệ</h4>
            <ul className="footer-links">
              <li style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Hỗ trợ trực tuyến: </span>
                <span style={{ color: 'var(--text-primary)' }}>contact@cinebooking.vn</span>
              </li>
              <li style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>Thời gian hỗ trợ: </span>
                <span style={{ color: 'var(--text-primary)' }}>08:00 - 22:00 hàng ngày</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} CineBooking. Bản quyền thuộc về hệ thống CineBooking.</p>
        </div>
      </div>
    </footer>
  );
}
