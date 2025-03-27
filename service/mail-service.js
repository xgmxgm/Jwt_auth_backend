const nodemailer = require('nodemailer')

class MailService {
	constructor() {
		this.transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
		})
	}

	async sendActivationMail(to, link) {}
}

module.exports = new MailService()
