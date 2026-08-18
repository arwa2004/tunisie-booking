const express = require('express');
const app = express();
app.use(express.json());

const configs = {
    'user-service': {
        server: { port: 8000 },
        spring: { application: { name: 'user-service' } },
        database: { type: 'MySQL', host: 'tb_mysql_db', port: 3306, name: 'user_db' }
    },
    'hotel-service': {
        server: { port: 8000 },
        spring: { application: { name: 'hotel-service' } },
        database: { type: 'H2', host: 'tb_h2_db', port: 1521, url: 'jdbc:h2:/opt/h2-data/test' }
    },
    'booking-service': {
        server: { port: 8000 },
        spring: { application: { name: 'booking-service' } },
        database: { type: 'MongoDB', host: 'tb_mongodb', port: 27017, name: 'booking_db' }
    }
};

app.get('/:service/:env', (req, res) => {
    const serviceName = req.params.service;
    if (configs[serviceName]) {
        res.json({
            name: serviceName,
            profiles: [req.params.env || 'default'],
            propertySources: [
                { name: `config-server/${serviceName}.yml`, source: configs[serviceName] }
            ]
        });
    } else {
        res.status(404).json({ error: 'Config file not found' });
    }
});

app.get('/', (req, res) => {
    res.json({
        server: "Spring Cloud Config Server",
        status: "UP 🟢",
        endpoints: [
            "/user-service/default",
            "/hotel-service/default",
            "/booking-service/default"
        ]
    });
});

app.listen(8888, () => console.log('Config Server running on port 8888'));
