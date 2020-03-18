const assert = require('assert');
const fetch = require('fetch-lite');

const apiBase = 'http://localhost:3000';
const random = (i, j) => Math.floor(Math.random() * j) + i;

const mockData = [
	{
		name: 'Jon Snow',
		age: 23,
		from: {
			place: 'Winterfell'
		}
	},
	{
		name: 'Arya Stark',
		age: 13,
		from: {
			place: 'Winterfell'
		}
	},
	{
		name: 'Visyrys',
		age: 26,
		from: {
			place: 'Dragonstone'
		}
	}
];
describe('jsonbox.io tests', () => {
	const boxId = `box_4a83b8cf8b0688d90790_${random(1000, 9999)}`;
	let recordId = null;
	console.log(`Box ID: ${boxId}`);
	describe('Create records', function() {
		it('Should be 200, with 3 records', async () => {
			const response = await fetch(`${apiBase}/${boxId}`, {
				method: 'POST',
				body: JSON.stringify(mockData),
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 3);
			return;
		});
	});
	describe('Read records', () => {
		it('Should be 200, with 3 records', async () => {
			const response = await fetch(`${apiBase}/${boxId}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 3);
		});
	});
	describe('Read _meta', () => {
		it('Should be 200, with 3 records', async () => {
			const response = await fetch(`${apiBase}/_meta/${boxId}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body["_count"], 3);
			assert.notEqual(response.body["_createdOn"], undefined);
		});
	});
	describe('Query records', () => {
		it('Should be 200, with 1 record', async () => {
			const response = await fetch(`${apiBase}/${boxId}?q=name:*stark,age:<15`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 1);
			recordId = response.body[0]._id;
		});
	});
	describe('Update record', () => {
		it('Should be 200', async () => {
			const response = await fetch(`${apiBase}/${boxId}/${recordId}`, {
				method: 'PUT',
				body: JSON.stringify({
					name: 'Arya Stark',
					age: 23,
					from: {
						place: 'Winterfell'
					}
				}),
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
		});
	});
	describe('Query records again to verify update', () => {
		it('Should be 200, with 0 records', async () => {
			const response = await fetch(`${apiBase}/${boxId}?q=name:*stark,age:<15`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 0);
		});
	});
	describe('Delete record', () => {
		it('Should be 200', async () => {
			const response = await fetch(`${apiBase}/${boxId}/${recordId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
		});
	});
	describe('Verify delete', () => {
		it('Should be 200, with 2 records', async () => {
			const response = await fetch(`${apiBase}/${boxId}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 2);
		});
	});
});

describe('jsonbox.io protected box tests', () => {
	const boxId = `box_4a83b8cf8b0688d90790_${random(1000, 9999)}`;
	let apiKey = 'f11842b5-0ee9-47e4-aeaf-1ddfce0e6fd9';
	console.log(`Box ID: ${boxId}`);
	describe('Create records', function() {
		it('Should be 200, with 3 records', async () => {
			const response = await fetch(`${apiBase}/${boxId}`, {
				method: 'POST',
				body: JSON.stringify(mockData),
				headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 3);
			recordId = response.body[0]._id;
		});
	});
	describe('Read records', () => {
		it('Should be 200, with 3 records', async () => {
			const response = await fetch(`${apiBase}/${boxId}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 200);
			assert.equal(response.body.length, 3);
		});
	});
	describe('Update record. Fail', () => {
		it('Should be 401', async () => {
			const response = await fetch(`${apiBase}/${boxId}/${recordId}`, {
				method: 'PUT',
				body: JSON.stringify({
					name: 'Arya Stark',
					age: 23,
					from: {
						place: 'Winterfell'
					}
				}),
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 401);
		});
	});
	describe('Delete record. Fail', () => {
		it('Should be 401', async () => {
			const response = await fetch(`${apiBase}/${boxId}/${recordId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' }
			});
			assert.equal(response.status, 401);
		});
	});
	describe('Update record.', () => {
		it('Should be 200', async () => {
			const response = await fetch(`${apiBase}/${boxId}/${recordId}`, {
				method: 'PUT',
				body: JSON.stringify({
					name: 'Arya Stark',
					age: 23,
					from: {
						place: 'Winterfell'
					}
				}),
				headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey }
			});
			assert.equal(response.status, 200);
		});
	});
	describe('Delete record.', () => {
		it('Should be 200', async () => {
			const response = await fetch(`${apiBase}/${boxId}/${recordId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json', Authorization: `API-KEY ${apiKey}` }
			});
			assert.equal(response.status, 200);
		});
	});
});
