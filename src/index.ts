import EmailSender from './EmailSender';

import source from './outsource/au.json';

const emails = source.filter((email) => email.status === 'unused');

try {
  const emailSender = EmailSender.getInstance(process.env.FROM as string);

  await emailSender.authorize();

  emailSender.initializeNodemailer();

  console.log('Email sender starts emailing!');

  console.log(`There are ${emails.length} emails to be sent.`);

  for (const { email } of emails) {
    emailSender.setMailOptions({
      to: email,
      subject: process.env.SUBJECT as string,
      text: process.env.TEXT_REMOTE as string,
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
