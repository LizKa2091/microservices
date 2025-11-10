import dotenv from 'dotenv';

dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

import { createServer } from './server';

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
const server = createServer();

server.listen(port, () => {
   console.log(`service-users listening on ${port}`);
});
