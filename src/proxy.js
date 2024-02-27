/* eslint-disable no-restricted-syntax */
/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
// Simple proxy server with registrar function.
import debugObj from 'debug';

const debug = debugObj('api:socket');

const sip = require('sip');
const proxy = require('sip/proxy');
const crypto = require('crypto');

const bindings = {};

function contacts(user) {
  const record = bindings[user];
  if (!record) {
    return [];
  }
  return Object.keys(record).map(function (x) {
    return record[x];
  });
}
function onRegister(rq, flow) {
  const { user } = sip.parseUri(rq.headers.to.uri);
  if (rq.headers.contact === '*') {
    delete bindings[user];
  } else {
    console.log('here user', user);
    let record = bindings[user];
    if (!record) {
      // eslint-disable-next-line no-multi-assign
      record = bindings[user] = {};
    }

    rq.headers.contact.forEach(function (x) {
      const ob = !!(x.params['reg-id'] && x.params['+sip.instance']);
      const key = ob
        ? [x.params['+sip.instance'], x.params['reg-id']].join()
        : rq.headers['call-id'];

      if (!record[key] || record[key].seq < rq.headers.cseq.seq) {
        const binding = {
          contact: x,
          expires: Date.now() + (+x.params.expires || +rq.headers.expires || 3600) * 1000,
          seq: rq.headers.cseq.seq,
          ob,
        };

        if (ob) {
          const route_uri = sip.encodeFlowUri(flow);
          route_uri.params.lr = null;
          binding.route = [{ uri: route_uri }];
        }
        record[key] = binding;
      }
    });
  }

  if (!rq.headers.to.params.tag) {
    rq.headers.to.params.tag = crypto.randomBytes(8).toString('hex');
  }

  const c = contacts(user);
  if (c.length) {
    proxy.send(
      sip.makeResponse(rq, 200, 'OK', {
        headers: {
          contact: contacts(user).map(function (c1) {
            return c1.contact;
          }),
          required: c.some(function (x) {
            return x.ob;
          })
            ? 'path, outbound'
            : undefined,
          supported: 'path, outbound',
        },
      })
    );
  } else {
    proxy.send(sip.makeResponse(rq, 200, 'OK', { headers: { contact: '*' } }));
  }
}

function forwardOutOfDialogRequest(rq, flow) {
  console.log('forwardOutOfDialogRequest');
  const c = contacts(rq.uri.user);
  if (c.length) {
    rq.uri = c[0].contact.uri;
    if (c[0].ob) {
      const flow_uri = sip.encodeFlowUri(flow);
      flow_uri.params.lr = null;
      rq.headers.route = c[0].route.concat(rq.headers.route || []);
      rq.headers['record-route'] = [{ uri: flow_uri }].concat(
        c[0].route,
        rq.headers['record-route'] || []
      );
    }
    console.log('here c', c, rq.uri.user);
    proxy.send(rq);
  } else {
    proxy.send(sip.makeResponse(rq, 404, 'Not Found'));
  }
}

function forwardInDialogRequest(rq, flow) {
  if (rq.headers.route) {
    const furi = sip.encodeFlowUri(flow);
    // eslint-disable-next-line eqeqeq
    if (rq.headers.route[0].hostname == furi.hostname && rq.headers.route[0].user == furi.user) {
      rq.headers.route.shift();
    }
  }

  proxy.send(rq);
}

proxy.start(
  {
    hostname: 'localhost',
    ws_port: 5000,
  },
  function (rq, flow) {
    console.info('\x1b[36m%s\x1b[0m', rq.method, rq?.headers?.from?.uri);
    rq.uri = sip.parseUri(rq.uri);

    if (rq.method === 'REGISTER') {
      onRegister(rq, flow);
    } else if (!rq.headers.to.params.tag) {
      forwardOutOfDialogRequest(rq, flow);
    } else {
      forwardInDialogRequest(rq, flow);
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
