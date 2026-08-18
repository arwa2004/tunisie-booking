const express = require('express');
const http    = require('http');

const app = express();
app.use(express.json());

// Liste des microservices métiers enregistrés auprès d'Eureka
const registeredServices = [
  { name: 'USER-SERVICE',    host: 'tb_user_service',    port: 8000, path: '/health' },
  { name: 'HOTEL-SERVICE',   host: 'tb_hotel_service',   port: 8000, path: '/health' },
  { name: 'BOOKING-SERVICE', host: 'tb_booking_service', port: 8000, path: '/health' }
];

// Helper : Vérifie le statut réel (heartbeat) d'un microservice
function checkServiceStatus(service) {
  return new Promise((resolve) => {
    const req = http.request({
      host: service.host,
      port: service.port,
      path: service.path,
      method: 'GET',
      timeout: 2500
    }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve({ ...service, status: 'UP', count: 1 });
      } else {
        resolve({ ...service, status: 'DOWN', count: 0 });
      }
    });

    req.on('error', () => {
      resolve({ ...service, status: 'DOWN', count: 0 });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ...service, status: 'DOWN', count: 0 });
    });

    req.end();
  });
}

// ── GET / → Interface visuelle Eureka Server DYNAMIQUE ───────────────────────
app.get('/', async (_req, res) => {
  const statuses = await Promise.all(registeredServices.map(checkServiceStatus));

  const tableRows = statuses.map(s => {
    const isUp = s.status === 'UP';
    const badgeClass = isUp ? 'badge-up' : 'badge-down';
    const badgeText  = isUp ? `UP (${s.count})` : `DOWN (${s.count})`;
    const url = `http://tb_${s.name.toLowerCase().replace(/-/g, '_')}:${s.port}`;

    return `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>n/a</td>
        <td>1</td>
        <td><span class="${badgeClass}">${badgeText}</span> - ${url}</td>
      </tr>
    `;
  }).join('');

  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Eureka Server — TunisieBooking</title>
        <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f6f9; margin: 0; padding: 20px; }
            .header { background: #6db33f; color: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            h1 { margin: 0; font-size: 24px; }
            .subtitle { font-size: 14px; opacity: 0.9; margin-top: 5px; }
            .section { background: white; margin-top: 20px; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #e1e8ed; }
            th { background: #f8faef; color: #333; font-weight: 600; }
            .badge-up { background: #27ae60; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .badge-down { background: #e74c3c; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: bold; }
        </style>
        <meta http-equiv="refresh" content="10">
    </head>
    <body>
        <div class="header">
            <h1>🌐 Spring Cloud Eureka Server</h1>
            <div class="subtitle">Service Discovery Registry — TunisieBooking Architecture</div>
        </div>

        <div class="section">
            <h2>System Status</h2>
            <p><strong>Environment:</strong> production</p>
            <p><strong>Current time:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
            <h2>Instances currently registered with Eureka</h2>
            <table>
                <thead>
                    <tr>
                        <th>Application</th>
                        <th>AMIs</th>
                        <th>Availability Zones</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    </body>
    </html>
    `);
});

// ── GET /eureka/apps → API REST Eureka DYNAMIQUE ─────────────────────────────
app.get('/eureka/apps', async (_req, res) => {
  const statuses = await Promise.all(registeredServices.map(checkServiceStatus));

  res.json({
    applications: {
      application: statuses.map(s => ({
        name: s.name,
        instance: [{
          instanceId: `${s.name.toLowerCase()}:${s.port}`,
          status: s.status
        }]
      }))
    }
  });
});

const PORT = process.env.PORT || 8761;
app.listen(PORT, () => console.log(`🟢 Dynamic Eureka Server running on port ${PORT}`));
