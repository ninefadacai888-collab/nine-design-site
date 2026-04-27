import nodemailer from "nodemailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, phone, email, store, accountLast5 } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"訂單通知" <${process.env.GMAIL_USER}>`,
      to: "ninefadacai888@gmail.com",
      subject: "新訂單通知",
      text: `
姓名：${name}
電話：${phone}
Email：${email}
門市：${store}
末五碼：${accountLast5}
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ message: "寄信失敗" });
  }
}
