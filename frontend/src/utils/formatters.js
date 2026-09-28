/**
 * Shared formatting utilities for CineBooking
 */

/**
 * Format number to Vietnamese currency format (e.g. 90.000 đ)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatVND(amount) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 đ';
  }
  return `${Number(amount).toLocaleString('vi-VN')} đ`;
}

/**
 * Format ISO date string or Date to HH:mm (e.g. 19:30)
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatTime(dateInput) {
  if (!dateInput) return '--:--';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '--:--';
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format ISO date string or Date to DD/MM/YYYY
 * @param {string|Date} dateInput
 * @returns {string}
 */
export function formatDateVN(dateInput) {
  if (!dateInput) return 'Đang cập nhật';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return 'Đang cập nhật';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Convert Date to YYYY-MM-DD in local timezone
 * @param {Date} date
 * @returns {string}
 */
export function toLocalDateString(date) {
  if (!date || isNaN(new Date(date).getTime())) return '';
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalize Date to midnight (00:00:00) local time for clean day comparison
 * @param {Date|string} date
 * @returns {Date}
 */
function toMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Calculate Vietnamese label for a day based on REAL current calendar date
 * "Hôm nay", "Ngày mai" MUST be based on real date difference, not list index!
 * @param {Date|string} targetDate
 * @param {Date} [referenceDate=new Date()]
 * @returns {string}
 */
export function getRelativeDayLabel(targetDate, referenceDate = new Date()) {
  const target = toMidnight(targetDate);
  const today = toMidnight(referenceDate);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Ngày mai';
  if (diffDays === -1) return 'Hôm qua';

  const dayOfWeek = target.getDay(); // 0: Sunday, 1: Monday...
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  return days[dayOfWeek];
}
