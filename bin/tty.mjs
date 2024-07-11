#!/usr/bin/env node

/**
 * Copyright 2024 Mac Heller-Ogden
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import path from 'node:path';
import express from 'express';
import { createServer } from 'node:http';
import net from 'node:net';
import pty from 'node-pty';
import { WebSocketServer } from 'ws';

const app = express();

const server = createServer(app);
app.use('/', express.static('.'));

const wss = new WebSocketServer({ server })

wss.on('connection', ws => {
    const ptyProcess = pty.spawn('bash', ['--login'], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.env.HOME,
        env: process.env
    });
    ptyProcess.on('data', data => ws.send(data));
    ws.on('message', message => {
        console.log('received: %s', message);
        let payload = message;
        try {
            let data = JSON.parse(message);
            if (data.event === 'resize') payload = data;
        } catch (e) {}
        if (payload?.event === 'resize') {
            ptyProcess.resize(payload?.size?.cols, payload?.size?.rows);
        } else {
            ptyProcess.write(payload);
        }

    });
});

function start(config) {
    console.log(`Server started on port ${config.SERVER_ADDRESS.port}`)
}

server.listen(9394, () => {
    const config = {
        SERVER_ADDRESS: server.address()
    };
    start(config);
});
