import { createServer } from "./server";

const port = process.env.PORT ? Number(process.env.PORT) : 4002;
const server = createServer();

server.listen(port, () => {
   console.log(`service-orders listening on ${port}`);
});