
const request = require('supertest');
const chai = require('chai');

const expect = chai.expect;
const app = require('../server');

describe('GET /api/initialQuestions', function() {
  it('respond with json', function() {
    return request(app)
      .get('/api/initialQuestions')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
  });
});