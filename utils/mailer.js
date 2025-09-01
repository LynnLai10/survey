const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Email template constants
const EMAIL_TEMPLATES = {
	VERIFICATION_CODE_SIGMA_Q: 'verification-code-sigma-q',
};

// Language constants
const LANGUAGES = {
	ENGLISH: 'en',
	CHINESE: 'zh',
};

// AWS SQS client for sending emails via lambda
const sqsClient = new SQSClient({
	apiVersion: '2012-11-05',
	region: process.env.AWS_REGION,
	credentials: {
		accessKeyId: process.env.AWS_ACCESS_KEY_ID,
		secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	},
});

// Generate mail parameters for SQS
const generateMailParams = (templateValue, toValue, htmlValue, paramsValue, message, subject) => {
	return {
		DelaySeconds: 10,
		MessageAttributes: {
			template: {
				DataType: 'String',
				StringValue: templateValue,
			},
			to: {
				DataType: 'String',
				StringValue: toValue,
			},
			html: {
				DataType: 'String',
				StringValue: htmlValue,
			},
			params: {
				DataType: 'String',
				StringValue: paramsValue,
			},
			...(subject
				? {
						subject: {
							DataType: 'String',
							StringValue: subject,
						},
					}
				: {}),
		},
		MessageBody: message,
		QueueUrl: process.env.EMAIL_SERVICE_SQS_URL,
	};
};

/**
 * Send verification code email
 * @param {Object} options
 * @param {string} options.to Recipient email address
 * @param {string} options.code Verification code
 * @param {string} [options.name] User name
 * @param {string} [options.language] Language ('en' | 'zh')
 * @returns {Promise}
 */
async function sendVerificationCode({ to, code, name, language = LANGUAGES.ENGLISH }) {
	// Determine subject based on environment and language
	const isUAT = process.env.NODE_ENV !== 'production';
	const subjects = {
		[LANGUAGES.ENGLISH]: isUAT
			? 'UAT-Email Verification Code - SigmaQ'
			: 'Email Verification Code - SigmaQ',
		[LANGUAGES.CHINESE]: isUAT ? 'UAT-邮箱验证码 - SigmaQ' : '邮箱验证码 - SigmaQ',
	};
	const subject = subjects[language] || subjects[LANGUAGES.ENGLISH];

	// Send verification code email via SQS to lambda
	const mailParams = generateMailParams(
		EMAIL_TEMPLATES.VERIFICATION_CODE_SIGMA_Q,
		to,
		`${EMAIL_TEMPLATES.VERIFICATION_CODE_SIGMA_Q}.js`,
		JSON.stringify({
			code,
			language,
			name: name || '',
		}),
		'SigmaQ Verification Code',
		subject
	);

	return sqsClient.send(new SendMessageCommand(mailParams));
}

module.exports = {
	sendVerificationCode,
	EMAIL_TEMPLATES,
	LANGUAGES,
};
