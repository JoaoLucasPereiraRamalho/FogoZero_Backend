const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 465,
  secure: process.env.EMAIL_PORT == 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmail(para, assunto, texto) {
  try {
    const info = await transporter.sendMail({
      from: `"FogoZero MG" <${process.env.EMAIL_USER}>`,
      to: para,
      subject: assunto,
      text: texto,
    });

    console.log("📨 E-mail enviado com sucesso: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Erro ao enviar e-mail real:", error);
    return null;
  }
}

module.exports = { enviarEmail };
