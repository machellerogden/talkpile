import fs from 'node:fs';
import os from 'node:os';
import process from 'node:process';
import util from 'node:util';
import { PassThrough } from 'node:stream';
import { Transform, Readable } from 'node:stream';
import { spawn } from 'node:child_process';

import chalk from 'chalk';

function resetableTimeout(callback, ms, onReset = () => {}) {
    let tid = setTimeout(callback, ms);
    return {
        reset() {
            onReset();
            clearTimeout(tid);
            tid = setTimeout(callback, ms);
        },
        cancel() {
            clearTimeout(tid);
        }
    };
}

const osType = os.type();
const isMac = osType == 'Darwin';
const isWindows = osType.includes('Windows');

export const mic = function mic(options) {

    options = options ?? {};

    const endian = options.endian ?? 'little';
    const bitwidth = options.bitwidth ?? '16';
    const encoding = options.encoding ?? 'signed-integer';
    const rate = options.rate ?? '16000';
    const channels = options.channels ?? '1';
    const device = options.device ?? 'plughw:1,0';
    const silenceVolumeThreshold = options.silenceVolumeThreshold ?? 1250;
    const fileType = options.fileType ?? 'raw';
    const debug = options.debug ?? false;
    const formatEndian = endian === 'big' ? 'BE' : 'LE';
    const formatEncoding = encoding === 'unsigned-integer' ? 'U' : 'S';
    const format = formatEncoding + bitwidth + '_' + formatEndian;
    const audioProcessOptions = { stdio: [ 'ignore', 'pipe', 'ignore' ] };


    const infoStream = new PassThrough;
    const audioStream = new IsSilence({ debug });

    let audioProcess = null;

    if (debug) audioProcessOptions.stdio[2] = 'pipe';

    audioStream.silenceVolumeThreshold = parseInt(silenceVolumeThreshold, 10);

    const client = {
        start() {
            if (audioProcess === null) {

                if (isWindows) {
                    audioProcess = spawn('sox', [
                        '-b', bitwidth,
                        '--endian', endian,
                        '-c', channels,
                        '-r', rate,
                        '-e', encoding,
                        '-t', 'waveaudio',
                        'default', '-p'
                    ], audioProcessOptions);
                } else if (isMac) {
                    audioProcess = spawn('rec', [
                        '-b', bitwidth,
                        '--endian', endian,
                        '-c', channels,
                        '-r', rate,
                        '-e', encoding,
                        '-t', fileType,
                        '-'
                    ], audioProcessOptions);
                } else {
                    audioProcess = spawn('arecord', [
                        '-t', fileType,
                        '-c', channels,
                        '-r', rate,
                        '-f', format,
                        '-D', device
                    ], audioProcessOptions);
                }

                audioProcess.on('exit', function(code, sig) {
                    if (code != null && sig === null) {
                        audioStream.emit('audioProcessExitComplete');
                        if (debug) console.log('recording audioProcess has exited with code = %d', code);
                    }
                });

                audioProcess.stdout.pipe(audioStream);

                if (debug) audioProcess.stderr.pipe(infoStream);

                audioStream.emit('startComplete');

            } else {
                if (debug) throw new Error('Duplicate calls to start(): Microphone already started!');
            }
        },
        stop() {
            if (audioProcess != null) {
                audioProcess.kill('SIGTERM');
                audioProcess = null;
                audioStream.emit('stopComplete');
                if (debug) console.log('Microphone stopped');
            }
        },
        pause() {
            if (audioProcess != null) {
                audioProcess.kill('SIGSTOP');
                audioStream.pause();
                audioStream.emit('pauseComplete');
                if (debug) console.log('Microphone paused');
            }
        },
        resume() {
            if (audioProcess != null) {
                audioProcess.kill('SIGCONT');
                audioStream.resume();
                audioStream.emit('resumeComplete');
                if (debug) console.log('Microphone resumed');
            }
        },
        get audioStream() {
            return audioStream;
        }
    };

    if (debug) {
        infoStream.on('data', data => console.log('Received Info: ' + data));
        infoStream.on('error', error => console.log('Error in Info Stream: ' + error));
    }

    return client;
}

class IsSilence extends Transform {
    #silenceVolumeThreshold = 500;
    get silenceVolumeThreshold() {
        return this.#silenceVolumeThreshold;
    }
    set silenceVolumeThreshold(vol) {
        this.#silenceVolumeThreshold = vol;
        return;
    }
    _transform(chunk, encoding, callback) {
        const l = chunk.length;
        let volume = 0;
        let silenceLength = 0;
        for (let i = 0; i < l; i = i + 2) {
            const c = chunk[i + 1];
            let audioSample = c > 128
                ? (c - 256) * 256
                : c * 256;
            audioSample += chunk[i];
            volume = Math.abs(audioSample);
            if (volume > this.silenceVolumeThreshold) {
                this.emit('sound', { chunk, volume });
                break;
            } else {
                silenceLength++;
            }
        }
        if (silenceLength == chunk.length / 2) this.emit('silence', { chunk, volume });
        this.push(chunk);
        callback();
    }
}

export function recordAudio(filename, { maxSilenceMs, silenceVolumeThreshold, logStream } = {}) {
    logStream = logStream ?? fs.createWriteStream('/dev/null');
    return new Promise((resolve, reject) => {
        let totalSilence = 0;

        logStream.write(chalk.bold.red('RECORDING') + os.EOL);
        logStream.write(chalk.dim('max silence ms') + ' ' + maxSilenceMs + os.EOL);
        logStream.write(chalk.dim('vol threshold') + ' ' + silenceVolumeThreshold + os.EOL);

        const micInstance = mic({
            rate: '16000',
            channels: '1',
            fileType: 'wav',
            silenceVolumeThreshold
        });

        const micInputStream = micInstance.audioStream;

        const timer = resetableTimeout(() => {
            micInstance.stop();
        }, maxSilenceMs);

        micInputStream.on('audioProcessExitComplete', () => {
            logStream.write(chalk.bold.green('RECORDING COMPLETE') + os.EOL);
            resolve();
        });

        micInputStream.on('sound', ({ volume }) => {
            timer.reset();
            if (process.stdout.isTTY) logStream.write(`  ${chalk.green('===')}  ${chalk.green(volume)}                   \r`);
        });

        micInputStream.on('silence', ({ volume }) => {
            totalSilence++;
            if (process.stdout.isTTY) logStream.write(`  ${chalk.dim.white('---')}  ${chalk.dim.white(volume)}                   \r`);

        });

        const output = fs.createWriteStream(filename);
        const writable = new Readable().wrap(micInputStream);
        writable.pipe(output);
        if (process.stdout.isTTY) logStream.write(`  ${chalk.dim.white('---')}  0                   \r`);

        micInstance.start();

        micInputStream.on('error', (err) => reject(err));
    });
}

//await recordAudio('test.wav', {
    //maxSilenceMs: 3000,
    //silenceVolumeThreshold: 1000,
    //logStream: process.stdout
//});
