/* eslint-disable no-restricted-syntax */
import debugObj from 'debug';
// const AUDIO_FILE_PATH = './audio.mp3';
// Read the audio file

// const pcmData = pcmUtil.encode(audioBuffer, {
//   channels: 1, // Adjust the number of channels based on your audio file
//   bitDepth: 16, // Adjust the bit depth based on your audio file
//   sampleRate: 44100, // Adjust the sample rate based on your audio file
// });

// const { DgramAsPromised } = require('dgram-as-promised');

// const socket = DgramAsPromised.createSocket('udp4');
// const parseRtpPacket require('rtp-parser');
import { parseRtpPacket } from 'rtp-parser';
// import audioDecode from 'audio-decode';
// import audio from './audio.mp3';

const dgram = require('dgram');
const fs = require('fs');

const RTP_PORT = 12345;

// RTP Socket
const rtpSocket = dgram.createSocket('udp4');
const client = dgram.createSocket('udp4');
// Client sends RTP-like packets
const sendRTPPacket = (data) => {
  // const message = 'This is an RTP packet'; // Your RTP packet payload
  // const buffer = Buffer.from(message, 'utf8');

  client.send(data, 0, data.length, RTP_PORT, '127.0.0.1', (err) => {
    if (err) {
      console.error('Error sending RTP packet:', err);
    } else {
      console.log('RTP packet sent successfully');
    }
  });
};

// dgram.createSocket({ type: 'udp4', reuseAddr: true });

function parseSDP(sdp) {
  const lines = sdp.split('\r\n');
  const rtpInfo = {};

  for (const line of lines) {
    if (line.startsWith('m=audio')) {
      // Extract port number from the "m=audio" line
      const match = line.match(/m=audio\s+(\d+)/);
      if (match) {
        rtpInfo.port = parseInt(match[1], 10);
      }
    } else if (line.startsWith('c=')) {
      // Extract connection information from the "c=" line
      const match = line.match(/c=IN IP4 (\S+)/);
      if (match) {
        // eslint-disable-next-line prefer-destructuring
        rtpInfo.ip = match[1];
      }
    }
  }

  return rtpInfo;
}
const sip = require('sip');

const debug = debugObj('api:socket');

function extractRtpPortFromSdp(sdp) {
  const match = sdp.match(/m=audio\s+(\d+)\s+/);
  return match ? parseInt(match[1], 10) : null;
}
const sessions = {};
sip.start(
  {
    address: '0.0.0.0',
    ws_port: 5000,
    udp: true,
    traceSip: true,
    port: 5060,
    publicAddress: process.env.PUBLIC_IP,
  },
  async function (req) {
    let session = {};
    console.info('\x1b[36m%s\x1b[0m', req.method, req?.headers?.from?.uri);
    try {
      // if (req.method === 'OPTIONS') {
      //   const response = sip.makeResponse(req, 200, 'OK');
      //   response.headers.Allow =
      //     'OPTIONS, INVITE, ACK, CANCEL, BYE, INFO, NOTIFY, MESSAGE, REFER, UPDATE, PRACK';
      //   response.headers.Accept = 'application/sdp';
      //   response.headers.Supported = 'timer, 100rel, path, replaces';
      //   sip.send(response);
      // }
      // if (req.method === 'REGISTER') {
      //   sip.send(sip.makeResponse(req, 200, 'registered'));
      // }
      if (req.method === 'INVITE') {
        session = {
          id: req.headers['call-id'],
          from: req.headers.from,
          to: req.headers.to,
          sdp: req.content,
          rtp: req.headers['rtp-port'],
        };
        const sdpOffer = req.content;
        const sdp = req.content;
        // const rtpInfo = parseSDP(sdp);
        // console.log('here rtpInfo', rtpInfo);
        session.rtp = extractRtpPortFromSdp(sdpOffer);
        sessions.one = session;
        try {
          // rtpSocket.on('error', (err) => {
          //   console.error(`RTP server error: ${err}`);
          // });
          // rtpSocket.bind(RTP_PORT, '0.0.0.0', () => {
          //   console.log(`Listening for RTP packets on port${RTP_PORT} ${rtpInfo.port}`);
          // Send RTP packets
          // audioDecode(audioBuffer, { format: 'pcm' }).then((pcmData) => {
          // fs.readFile('audio.mp3', (err, audioData) => {
          //   if (err) {
          //     console.error('Error reading audio file:', err);
          //     return;
          //   }
          //   const packetSize = 1024; // Adjust the packet size based on your requirements
          //   for (let i = 0; i < audioData.length; i += packetSize) {
          //     const packet = audioData.slice(i, i + packetSize);
          //     sendRTPPacket(packet);
          //   }
          // });
          // });
          // setInterval(sendRTPPacket, 1000);
          // });
          // rtpSocket.on('message', (msg, rinfo) => {
          //   const rtpPacket = parseRtpPacket(msg);
          //   // Handle incoming RTP packets
          //   // Implement logic to process and forward RTP packets
          //   // Here, we are logging the received RTP packet information
          //   console.log(`Received RTP packet from ${rtpPacket} ${rinfo.address}:${rinfo.port}`);
          // });
        } catch (error) {
          throw new Error(error);
        }

        // const address = await socket.bind({ port: session.rtp });

        // console.info(`Socket is listening on ${address.address}:${address.port}`);
        // while (sessions.one) {
        //   try {
        //     console.log('here inside loop');
        //     // eslint-disable-next-line no-await-in-loop
        //     const { msg, rinfo } = await socket.recv();
        //     console.log(`Received UDP packet from ${rinfo.address}:${rinfo.port}: ${msg}`);
        //   } catch (error) {
        //     console.error('Error receiving UDP packet:', error);
        //   }
        // }
      }
      sip.send(sip.makeResponse(req, 200, 'registered'));
    } catch (error) {
      throw new Error(error);
    }
  }
);

export const handleWsConnection = (webSocket) => {
  console.log('connection');
  const ws = webSocket;
  ws.isAlive = true;

  ws.on('pong', function pong() {
    debug(`Recieved pong from user`);
    this.isAlive = true;
  });
  ws.on('message', (data) => {
    console.log(`Socket Received message - ${data}`);
    // const serverWs = new WebSocket(process.env.WEBSOCKET_URL);
    // serverWs.on('open', () => {
    // serverWs.send(JSON.stringify({ action: 'newCall', data })); // Example payload
    // });
  });
  ws.on('close', () => ws.close());
};
