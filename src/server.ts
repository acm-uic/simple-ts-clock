#!/usr/bin/env node

import app from './app';
import dotenv from 'dotenv';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';

dotenv.config();

const port = process.env.PORT;
const httpOptions: https.RequestOptions =
  process.env.HTTPS === 'true'
    ? {
        key: fs.readFileSync(path.resolve(process.env.SSL_KEY)),
        cert: fs.readFileSync(path.resolve(process.env.SSL_CERT)),
        ca: fs.readFileSync(path.resolve(process.env.SSL_CA)),
      }
    : {};

const server = process.env.HTTPS === 'true' ? https.createServer(httpOptions, app) : http.createServer(app);

server.listen(port, (): void => {
  console.log('Server started on port ' + port);
});

export default server;
