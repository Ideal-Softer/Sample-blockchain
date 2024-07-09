// ws.js
module.exports = function (app) {
    app.ws.use((ctx) => {
        ctx.websocket.on('open', () => {
            console.log('WebSocket connection opened');
            ctx.websocket.send('Welcome to the WebSocket server!');
        });

        ctx.websocket.on('message', (message) => {
            console.log('Received message:', message);
            // Additional message handling logic...
        });

        ctx.websocket.on('close', () => {
            console.log('WebSocket connection closed');
            // Handle close event...
        });

        ctx.websocket.on('error', (err) => {
            console.error('WebSocket error:', err);
            // Handle error event...
        });
    });

    // Define a global broadcast function
    app.broadcast = (data) => {
        app.ws.server.clients.forEach((client) => {
            if (client.readyState === 1) {
                client.send(data);
            }
        });
    };
};