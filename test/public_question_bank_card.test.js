const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

test('free bank card shows Free badge and checkout link', () => {
	const filePath = path.join(
		__dirname,
		'..',
		'client/src/components/questionBanks/PublicQuestionBankCard.tsx'
	);
	const content = fs.readFileSync(filePath, 'utf8');
	assert.ok(content.includes('Free'), 'contains Free label');
	assert.ok(content.includes('/checkout/bank/'), 'uses checkout route');
});
