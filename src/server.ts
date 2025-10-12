#!/usr/bin/env node

import fs from 'node:fs';
import http from 'node:http';
import https from 'node:https';
import dotenv from 'dotenv';
import path from 'path';
import app from './app';

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
  console.log(`Server started on port ${port}`);
});

export default server;
