const nodemailer=require('nodemailer');
const sendEmail=async(to,subject,html)=>{   
    try {
        if(!to || typeof to !== 'string') {
            throw new Error('Invalid recipient email address');
            }
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user:'kshenoy254@gmail.com',
                pass: 'xpgcgontuzpdanwk',
            },
        }); 
        const mailOptions = {
            from: `Bus Booking`,
            to,
            subject,
            html,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error.message);
    }
};

module.exports = sendEmail;