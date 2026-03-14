import http from 'http';

const server = http.createServer((req, res) => {
    res.end('OmniNexus API');
});

const PORT = Number(process.env.PORT) || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
