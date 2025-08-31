const { test, before, after } = require('node:test');
const assert = require('node:assert');
const mongoose = require('mongoose');
const express = require('express');
const http = require('http');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');

const PublicBank = require('../models/PublicBank');
const Order = require('../models/Order');
const User = require('../models/User');
const Company = require('../models/Company');
const CompanyQuestionBank = require('../models/CompanyQuestionBank');
const FreeBankAccessLog = require('../models/FreeBankAccessLog');
const publicBanksRouter = require('../routes/publicBanks');
const checkoutRouter = require('../routes/checkout');
const ordersRouter = require('../routes/orders');
const { JWT_SECRET } = require('../middlewares/jwtAuth');

let app;
let server;
let baseUrl;
let mongoServer;
let token;
let bankId;
let companyId;
let userId;

before(async () => {
	mongoServer = await MongoMemoryServer.create();
	await mongoose.connect(mongoServer.getUri());

	const company = await Company.create({ name: 'TestCo', slug: 'testco' });
	companyId = company._id;
	const user = await User.create({
		name: 'User1',
		email: 'user1@example.com',
		password: 'pass',
		role: 'admin',
		companyId,
	});
	userId = user._id;
	token = jwt.sign({ id: user._id }, JWT_SECRET);

	const bank = await PublicBank.create({
		title: 'Free Bank',
		description: 'Desc',
		type: 'free',
		priceOneTime: 0,
		isActive: true,
		isPublished: true,
		createdBy: userId,
	});
	bankId = bank._id.toString();

	app = express();
	app.use(express.json());
	app.use('/api/public-banks', publicBanksRouter);
	app.use('/api/checkout', checkoutRouter);
	app.use('/api/orders', ordersRouter);
	server = http.createServer(app);
	await new Promise(resolve => server.listen(0, resolve));
	const { port } = server.address();
	baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
	await mongoose.disconnect();
	await mongoServer.stop();
	server.close();
});

test('free bank purchase creates order and grants access', async () => {
	// bank should be locked before purchase
	const pre = await fetch(`${baseUrl}/api/public-banks/for-survey`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	const preBody = await pre.json();
	assert.strictEqual(preBody.authorized.length, 0);

	const res = await fetch(`${baseUrl}/api/checkout/free`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ bankId }),
	});
	assert.strictEqual(res.status, 200);
	const body = await res.json();
	assert.ok(body.orderId);

	const order = await Order.findOne({ companyId, bankId });
	assert.ok(order);
	const link = await CompanyQuestionBank.findOne({ companyId, bankId });
	assert.ok(link);
	const accessLog = await FreeBankAccessLog.findOne({ companyId, bankId, orderId: order._id });
	assert.ok(accessLog);

	const orderRes = await fetch(`${baseUrl}/api/orders/${order._id.toString()}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	assert.strictEqual(orderRes.status, 200);
	const orderBody = await orderRes.json();
	assert.strictEqual(orderBody.order._id.toString(), order._id.toString());
	assert.strictEqual(orderBody.bank._id.toString(), bankId);

	// bank should appear in authorized list after purchase
	const post = await fetch(`${baseUrl}/api/public-banks/for-survey`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	const postBody = await post.json();
	assert.strictEqual(postBody.authorized.length, 1);
	assert.strictEqual(postBody.authorized[0]._id.toString(), bankId);
});

test('duplicate purchase returns same order', async () => {
	const first = await fetch(`${baseUrl}/api/checkout/free`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ bankId }),
	});
	const body1 = await first.json();

	const second = await fetch(`${baseUrl}/api/checkout/free`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ bankId }),
	});
	const body2 = await second.json();
	assert.strictEqual(body1.orderId, body2.orderId);
	const orderCount = await Order.countDocuments({ companyId, bankId });
	assert.strictEqual(orderCount, 1);
	const linkCount = await CompanyQuestionBank.countDocuments({ companyId, bankId });
	assert.strictEqual(linkCount, 1);
	const logCount = await FreeBankAccessLog.countDocuments({ companyId, bankId });
	assert.strictEqual(logCount, 1);
});

test('non-free bank returns 400', async () => {
	const paidBank = await PublicBank.create({
		title: 'Paid Bank',
		description: 'Paid',
		type: 'paid',
		priceOneTime: 10,
		isActive: true,
		isPublished: true,
		createdBy: userId,
	});

	const res = await fetch(`${baseUrl}/api/checkout/free`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ bankId: paidBank._id.toString() }),
	});
	assert.strictEqual(res.status, 400);
});
