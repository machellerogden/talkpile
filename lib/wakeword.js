import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordAudio } from './mic.js';

import { Porcupine  } from '@picovoice/porcupine-node';
import { PvRecorder } from '@picovoice/pvrecorder-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isInterrupted = false;

const accessKey = process.env.PICOVOICE_ACCESS_KEY;
const keywordNames = ['Talk Pile'];
const keywordPaths = [path.resolve(__dirname, '../etc/keywords/Talk-Pile_en_mac_v3_0_0.ppn')];
const sensitivities = [0.5];
const audioDeviceIndex = 1;
const maxSilenceMs = 2200;
const silenceVolumeThreshold = 1600;

async function start() {
    const devices = PvRecorder.getAvailableDevices();
    console.log('Available audio devices:');
    console.table(devices);

    let engineInstance;

    try {
        engineInstance = new Porcupine(
            accessKey,
            keywordPaths,
            sensitivities
        );
    } catch (error) {
        console.error(`Error initializing Porcupine engine: ${error}`);
        return;
    }

    const frameLength = engineInstance.frameLength;

    const recorder = new PvRecorder(frameLength, audioDeviceIndex);

    try {

        recorder.start();

        console.log(`Using device: ${recorder.getSelectedDevice()}...`);

        console.log(`Listening for wake word(s): ${keywordNames}`);
        console.log("Press ctrl+c to exit.")

        while (!isInterrupted) {
            const pcm = await recorder.read();
            let index = engineInstance.process(pcm);
            if (index !== -1) {
              console.log(`Detected '${keywordNames[index]}'`);

              try {

                await recordAudio('test.wav', {
                    maxSilenceMs,
                    silenceVolumeThreshold,
                    logStream: process.stdout
                });

              } catch (error) {
                  console.error(`Error recording audio: ${error}`);
              }

            }
        }
    } catch (error) {
        console.error(`Error reading audio: ${error}`);

    } finally {
        console.log("Stopping...");
        recorder.release();
    }
}

process.on('SIGINT', function () {
    isInterrupted = true;
});

(async function () {
    try {
        await start();
    } catch (e) {
        console.error(e.toString());
    }
})();
