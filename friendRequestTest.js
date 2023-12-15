import chai from 'chai';
import supertest from 'supertest';
import io from 'socket.io-client';
import {app} from './index.js'; // Adjust the path accordingly

const { expect } = chai;
const api = supertest(app);

const SERVER_URL = process.env.APP_URL; // Adjust the URL/port based on your server setup

describe('Friend Request API', () => {
  
  let senderSocket;
  let recipientSocket;
  before(async () => {
    senderSocket = io(SERVER_URL);
    recipientSocket = io(SERVER_URL);
  });

  after((done) => {
    senderSocket.disconnect();
    recipientSocket.disconnect();
    done();
  });

  it('should send a friend request and notify the recipient via WebSocket', async function () {
    this.timeout(15000);
    // Emit 'setUserId' event for sender and recipient
    senderSocket.emit('setUserId', '65441c16c03ced4e8c81aed0');
    recipientSocket.emit('setUserId', '655fc182a1b7f0f9296c2945');

    // Simulate sending a friend request
    const res = await api.post('/friend-request/send-friend-request')
      .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTQ0MWMxNmMwM2NlZDRlOGM4MWFlZDAiLCJpYXQiOjE3MDE3MTk4OTUsImV4cCI6MTcwMTgwNjI5NX0.-Ncdvi90GO4VvT6n1jXngQ4nO8fI8DlEkRByPCYxEAs')
      .send({ recipientUserId: '655fc182a1b7f0f9296c2945'});

    expect(res.status).to.equal(201);

    // Listen for 'friendRequest' event on the recipient's socket
    const friendRequestPromise = new Promise((resolve) => {
      recipientSocket.on('friendRequest', (data) => {
        expect(data.user.senderId).to.equal('65441c16c03ced4e8c81aed0');
        expect(data.notification.content).to.equal(`${data.user.userName} vous a envoyé une demande d'ami.`);
        resolve();
      });
    });
  });
});
