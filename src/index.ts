import EmailSender from './EmailSender';

import source from './emailAddresses.json';

const emails = source.emailAddresses;

try {
  const emailSender = EmailSender.getInstance(process.env.FROM as string);

  await emailSender.authorize();

  emailSender.initializeNodemailer();

  console.log('Email sender starts emailing!');

  for (const email of emails) {
    emailSender.setMailOptions({
      to: email,
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

    const result = await emailSender.send();
    console.log('Email sent successfully:', result?.envelope);

    await emailSender.waitForSeconds(10);
  }

  console.log('All emails sent successfully!');
} catch (err) {
  console.error('Error catched: ', err);
}
