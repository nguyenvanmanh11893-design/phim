import nodemailer from "nodemailer";
import EmailServiceInterface from "../../../Domain/Services/EmailServiceInterface.js";
import { env } from "../../Config/env.js";

class NodemailerService extends EmailServiceInterface {
  constructor() {
    super();
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }

  async sendBookingConfirmation(
    emailAddress,
    bookingDetails,
    showtimeDetails,
    ticketDetails,
  ) {
    const htmlContent = `
      <h2>Cảm ơn bạn đã đặt vé tại CineBooking!</h2>
      <p>Mã đặt vé: <strong>${bookingDetails.id}</strong></p>
      <p>Tổng tiền: <strong>${bookingDetails.totalPrice} VND</strong></p>
      <p>Giờ chiếu: <strong>${new Date(showtimeDetails.startTime).toLocaleString("vi-VN")}</strong></p>
      ${ticketDetails ? `<p>Mã vé QR (Mã tham chiếu): <strong>${ticketDetails.qrCode}</strong></p>` : ""}
      <p>Vui lòng đưa mã vé này cho nhân viên để quét khi vào rạp.</p>
    `;

    await this.transporter.sendMail({
      from: `"CineBooking" <${env.SMTP_USER}>`,
      to: emailAddress,
      subject: `Xác nhận đặt vé thành công - Mã vé #${bookingDetails.id}`,
      html: htmlContent,
    });
  }
}

export default NodemailerService;
