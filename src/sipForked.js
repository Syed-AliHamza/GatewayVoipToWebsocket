import * as SIP from 'sip.js';
import wav from 'wav';

const mic = require('mic');

const fs = require('fs');

export const userAgent = new SIP.UA({
  uri: `sip:agent@localhost`,
  // wsServers: `ws://localhost:5000`,
  authorizationUser: 'agent',
  displayName: 'agent',
  password: 'agent',
  traceSip: true,
  transportOptions: {
    server: 'ws://localhost:5000',
    // sipServer: [`ws://localhost:5000`],
  },
});

userAgent.on('registered', onMessage('registered'));
userAgent.on('unregistered', onMessage('unregistered'));
// userAgent.on('registrationFailed', onMessage('registrationFailed'));
userAgent.on('message', onMessage('message'));
userAgent.on('invite', onMessage('invite'));
userAgent.on('inviteSent', onMessage('inviteSent'));
userAgent.on('outOfDialogReferRequested', onMessage('outOfDialogReferRequested'));
userAgent.on('transportCreated', onMessage('transportCreated'));
userAgent.on('notify', onMessage('notify'));
userAgent.on('subscribe', onMessage('subscribe'));
userAgent.findSession((req) => {
  console.log('here in useragend findSession', req);
});

process.on('SIGINT', () => {
  console.log('\nStopping user agent...');
  userAgent.stop();
});

// eslint-disable-next-line no-unused-vars
function makeCall() {
  const session = userAgent.invite(`sip:alice@localhost`, {
    sessionDescriptionHandlerOptions: {
      constraints: {
        audio: true,
        video: false,
      },
    },
  });
  session.on('accepted', function () {
    if (session.logger.category === 'sip.inviteclientcontext') {
      // const pc = session.sessionDescriptionHandler.peerConnection;
      try {
        session.sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver) => {
          if (receiver.track) {
            const micInstance = mic({
              rate: '44100',
              channels: '1',
              debug: true,
              exitOnSilence: 6, // seconds
            });

            const fileStream = fs.createWriteStream('audioFile.wav', { encoding: 'binary' });
            // Create a WAV encoder
            const wavEncoder = new wav.Writer({
              channels: 1, // Mono audio
              sampleRate: 44100, // Standard audio sample rate
              bitDepth: 16, // Standard audio bit depth
            });

            micInstance.getAudioStream().pipe(wavEncoder).pipe(fileStream);
            session.on('bye', function () {
              console.log('\nStopping recording...');
              micInstance.stop();
            });

            process.on('SIGINT', () => {
              console.log('\nStopping recording...');
              micInstance.stop();
            });

            console.log('Recording... Press Ctrl+C to stop.');
            micInstance.start();
          }
        });
      } catch (error) {
        console.log(error);
        throw new Error(error);
      }
      // const rtcAudioSource = new RTCAudioSource();
      // pc.getSenders().forEach(function (sender) {
      //   rtcAudioSource.addStream(fs.createReadStream('test.wav'), 16, 48000, 1);
      //   const track = rtcAudioSource.createTrack();
      //   sender.replaceTrack(track);
      // });
    }
  });
}

function onMessage(method) {
  if ('registered') {
    setTimeout(() => makeCall(), 5000);
  }
  console.info('\x1b[31m%s\x1b[0m', 'virtual agent before:', method);
  return () => {
    console.info('\x1b[35m%s\x1b[0m', 'virtual agent:', method);
    // console.log(`virtual agent: ${method}`);
  };
}
