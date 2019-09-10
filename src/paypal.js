const crypto = require("crypto");
const fetch = require("fetch-lite");
const nodemailer = require('nodemailer');

const config = require("./config");
const Db = require('./db').getInstance();
const Box = Db.Box;
const uuidv4 = require('uuid/v4');

const paypalToken = Buffer.from(config.PAYPAL_CLIENT_ID + ":" + config.PAYPAL_SECRET).toString('base64');
const transporter = nodemailer.createTransport({
	service: 'gmail',
	auth: {
		user: 'jsonbox.io@gmail.com',
		pass: config.GMAIL_PASSWORD
	}
});
const formatDate = function(datestring) {
	const date = new Date(datestring);
	return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()] + ' ' +
		(date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) + ', ' + date.getFullYear();
};

const genToken = () => {
	return crypto.createHash('sha256').update(uuidv4() + uuidv4()).digest('hex');
};

module.exports = async (req, res) => {
	const orderID = req.body.orderID;
	try {
		const response = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders/' + orderID, {
			method: 'GET',
			headers: {
				'content-type': 'application/json',
				'Authorization': "Basic " + paypalToken
			}
		});
		const responseBody = response.body;
		if (responseBody.purchase_units[0].custom_id &&
			responseBody.purchase_units[0].amount.value == '24.00' &&
			responseBody.purchase_units[0].amount.currency_code == 'USD') {
			const boxKey = responseBody.purchase_units[0].custom_id;
			const email = req.body.email;
			const date = new Date();

			const thisBox = await Box.findOne({ key: boxKey }).exec();
			if (thisBox) {
				var expiry = thisBox.expiry;
				expiry.setFullYear(expiry.getFullYear() + 1);
				var readKey = thisBox.access.find(a => a.permission == 'READ').key;
				var writeKey = thisBox.access.find(a => a.permission == 'READWRITE').key;
				await Box.updateOne({ key: boxKey }, { expiry: expiry, renewedOn: date });
			} else {
				var expiry = new Date();
				expiry.setFullYear(expiry.getFullYear() + 1);
				expiry.setHours(23);
				expiry.setMinutes(59);
				expiry.setSeconds(59);
				var readKey = genToken();
				var writeKey = genToken();
				var body = {
					key: boxKey,
					email: email,
					type: "PRIVATE",
					expiresOn: expiry,
					createdOn: date,
					access: [{ key: readKey, permission: 'READ' }, { key: writeKey, permission: 'READWRITE' }]
				}
				await new Box(body).save();
			}

			res.json({ message: "Payment successful", readKey: readKey, writeKey: writeKey, expiry: expiry });

			//send mail to the user with access keys
			sendMail(email, boxKey, writeKey, readKey, expiry);
		} else res.status(400).json({ message: "Invalid payment info" });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: "Something went wrong" });
	}
}

const sendMail = (email, boxKey, writeKey, readKey, expiry) => {
	var mailOptions = {
		from: "jsonbox.io <jsonbox.io@gmail.com>",
		to: email,
		subject: 'Your private box is ready!',
		html: 'Hello <br/> Your private box in jsonbox.io is ready. Please find the details below: <br/><br/>' +
			'<b>Box ID:</b> <i>' + boxKey + '</i><br/>' +
			'<b>API Secret (READ & WRITE):</b> <i>' + writeKey + '</i><br/>' +
			'<b>API Secret (READONLY):</b> <i>' + readKey + '</i><br/>' +
			'<b>Type:</b> <i>PRIVATE</i><br/>' +
			'<b>Expires On:</b> <i>' + formatDate(expiry) + '</i><br/><br/>' +
			'<small>Thank you for choosing jsonbox.io. You can find the documentation <a href="https://jsonbox.io/#docs">here</a>. For any queries you can reply to this email. </small>'
	}
	transporter.sendMail(mailOptions, (error, response) => {
		if (error) console.log(error);
		console.log(response);
	});
}
