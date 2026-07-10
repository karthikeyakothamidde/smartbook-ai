const https = require('https');
const token = 'rnd_2UVL2QgRs4oiM2urZE7W2LgOKMDt';
const serviceId = 'srv-d97t5s6trd3s739n6b90';

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    // 1. Update build command on Render to run local npm prisma:push script
    const update = await request({
      hostname: 'api.render.com',
      path: `/v1/services/${serviceId}`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {
      serviceDetails: {
        envSpecificDetails: {
          buildCommand: 'npm install --production=false --prefix server && npm run prisma:push --prefix server && npm run prisma:generate --prefix server && npm run build --prefix server'
        }
      }
    });
    console.log('Update Service response:', update);

    // 2. Trigger new deploy
    const deploy = await request({
      hostname: 'api.render.com',
      path: `/v1/services/${serviceId}/deploys`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, {});
    console.log('Triggered Deploy response:', deploy);
  } catch (err) {
    console.error('Error running update:', err);
  }
}

run();
