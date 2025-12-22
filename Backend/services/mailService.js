import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOtpEmail = async (to, otp) => {
  const mailOptions = {
    from: `"HVTSocial" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Mã OTP khôi phục mật khẩu HVTSocial",
    html: `
      <p>Chào bạn,</p>
      <p>Mã OTP để khôi phục mật khẩu tài khoản HVTSocial của bạn là:</p>
      <h2>${otp}</h2>
      <p>Mã này có hiệu lực trong 5 phút.</p>
      <p>Nếu không phải bạn yêu cầu, hãy bỏ qua email này.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};
