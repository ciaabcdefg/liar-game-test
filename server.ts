import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { registerSocketHandlers } from './lib/socketHandler';

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname: 'localhost', port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    const io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });

    registerSocketHandlers(io);

    server.listen(port, hostname, () => {
        console.log(`
╔══════════════════════════════════════════════╗
║         🎭 GUESS THE LIAR - SERVER 🎭        ║
╠══════════════════════════════════════════════╣
║                                              ║
║   Local:   http://localhost:${port}             ║
║   Network: http://${getLocalIP()}:${port}        ║
║                                              ║
║   Share the Network URL with players!        ║
║                                              ║
╚══════════════════════════════════════════════╝
    `);
    });
});

function getLocalIP(): string {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                return net.address;
            }
        }
    }
    return 'localhost';
}
