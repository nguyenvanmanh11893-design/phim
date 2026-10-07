import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import AppError from "../../../Domain/Errors/AppError.js";

const encode = (value) => encodeURIComponent(String(value)).replace(/%20/g, "+");
export const serializeVnpay = (params) => Object.keys(params).sort()
  .map((key) => encode(key) + "=" + encode(params[key])).join("&");

export function formatVnpayDate(date) {
  return new Date(new Date(date).getTime() + 7 * 3600000).toISOString()
    .slice(0, 19).replace(/[-T:]/g, "");
}
export function parseVnpayDate(value) {
  if (typeof value !== "string" || !/^\d{14}$/.test(value)) return null;
  const date = new Date(value.slice(0, 4) + "-" + value.slice(4, 6) + "-" + value.slice(6, 8) + "T" +
    value.slice(8, 10) + ":" + value.slice(10, 12) + ":" + value.slice(12, 14) + "+07:00");
  return !Number.isNaN(date.getTime()) && formatVnpayDate(date) === value ? date : null;
}

class VnpayService {
  constructor(config) { this.config = config; }

  assertConfigured() {
    const c = this.config;
    if (!c.VNPAY_TMN_CODE || !c.VNPAY_HASH_SECRET || !c.VNPAY_RETURN_URL) {
      throw new AppError("VNPay chưa được cấu hình trên backend", 503);
    }
    for (const value of [c.VNPAY_URL, c.VNPAY_RETURN_URL]) {
      let url;
      try { url = new URL(value); } catch { throw new AppError("Cấu hình URL VNPay không hợp lệ", 503); }
      if (url.protocol !== "https:" && !(c.NODE_ENV !== "production" && url.protocol === "http:" &&
          ["localhost", "127.0.0.1"].includes(url.hostname))) {
        throw new AppError("URL VNPay phải sử dụng HTTPS", 503);
      }
    }
  }

  sign(params) {
    return createHmac("sha512", this.config.VNPAY_HASH_SECRET)
      .update(serializeVnpay(params), "utf8").digest("hex");
  }

  createPaymentUrl(payment, clientIp) {
    this.assertConfigured();
    const ip = clientIp?.replace(/^::ffff:/, "");
    if (!isIP(ip || "")) throw new AppError("Không xác định được IP khách hàng", 400);
    const amount = payment.amount * 100;
    if (!Number.isSafeInteger(amount) || amount <= 0 || String(amount).length > 12) {
      throw new AppError("Số tiền không hợp lệ với VNPay", 422);
    }
    const params = {
      vnp_Version: "2.1.0", vnp_Command: "pay", vnp_TmnCode: this.config.VNPAY_TMN_CODE,
      vnp_Amount: String(amount), vnp_CurrCode: "VND", vnp_Locale: "vn",
      vnp_TxnRef: String(payment.id), vnp_OrderType: "other",
      vnp_OrderInfo: "Thanh toan ve phim booking " + payment.bookingId,
      vnp_ReturnUrl: this.config.VNPAY_RETURN_URL, vnp_IpAddr: ip,
      vnp_CreateDate: formatVnpayDate(payment.createdAt),
      vnp_ExpireDate: formatVnpayDate(payment.expiredAt),
    };
    return this.config.VNPAY_URL + "?" + serializeVnpay(params) + "&vnp_SecureHash=" + this.sign(params);
  }

  verify(query) {
    this.assertConfigured();
    const params = {};
    for (const [key, value] of Object.entries(query)) {
      if (!key.startsWith("vnp_")) continue;
      if (typeof value !== "string") return null;
      if (!["vnp_SecureHash", "vnp_SecureHashType"].includes(key)) params[key] = value;
    }
    const hash = query.vnp_SecureHash;
    if (typeof hash !== "string" || !/^[a-f\d]{128}$/i.test(hash)) return null;
    if (!timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(this.sign(params), "hex"))) return null;
    if (params.vnp_TmnCode !== this.config.VNPAY_TMN_CODE ||
        !/^[1-9]\d*$/.test(params.vnp_TxnRef || "") ||
        !Number.isSafeInteger(Number(params.vnp_TxnRef)) ||
        !/^\d{1,12}$/.test(params.vnp_Amount || "") ||
        !/^\d{2}$/.test(params.vnp_ResponseCode || "") ||
        !/^\d{2}$/.test(params.vnp_TransactionStatus || "") ||
        !/^\d{1,15}$/.test(params.vnp_TransactionNo || "")) return null;
    const success = params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00";
    const paidAt = parseVnpayDate(params.vnp_PayDate);
    if (success && (!paidAt || params.vnp_TransactionNo === "0")) return null;
    return { paymentId: Number(params.vnp_TxnRef), amount: Number(params.vnp_Amount),
      transactionId: params.vnp_TransactionNo, responseCode: params.vnp_ResponseCode,
      transactionStatus: params.vnp_TransactionStatus, success, paidAt };
  }
}
export default VnpayService;
