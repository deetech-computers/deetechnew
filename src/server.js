// server.js or api/sendEmail.js
import express from 'express';
import nodemailer from 'nodemailer';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'deetechcomputers01@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD // store securely in .env
  }
});

app.post('/send-email', async (req, res) => {
  const { to, subject, text } = req.body;

  try {
    const info = await transporter.sendMail({
      from: 'deetechcomputers01@gmail.com',
      to,
      subject,
      text
    });
    res.status(200).json({ success: true, info: info.response });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));
