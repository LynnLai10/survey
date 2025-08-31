const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('confirmation page contains success message', () => {
	const filePath = path.join(
		__dirname,
		'..',
		'client/src/components/questionBanks/QuestionBankConfirmationPage.tsx'
	);
	const content = fs.readFileSync(filePath, 'utf8');
	assert.ok(content.includes('successfully added'));
	assert.ok(content.includes('Order Not Found'));
});
