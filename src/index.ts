import EmailSender from './EmailSender';

import { to } from './config';

try {
  const emailSender = EmailSender.getInstance('hazarnamdarrr@gmail.com');

  await emailSender.authorize();
  emailSender.initializeNodemailer().setMailOptions({
    to,
    subject: process.env.SUBJECT as string,
    text: process.env.TEXT as string,
    attachments: [
      {
        filename: 'Hazar_Namdar_CV.pdf',
        content: emailSender.readDocument('hazar-namdar-en.pdf'),
        encoding: 'base64',
      },
    ],
  });
  await emailSender.send();
} catch (err) {
  console.error('Error catched: ', err);
}
