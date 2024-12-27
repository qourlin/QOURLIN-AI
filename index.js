/*<============== CREDITS ==============>
	Author: @berkahesport.id
	Contact me: 62895375950107
	
	Do not delete the source code.
	It is prohibited to sell and buy
	WhatsApp BOT scripts
	without the knowledge
	of the script owner.
	
	Selling = Sin 
	
	Thank you to Allah S.W.T
<============== CREDITS ==============>*/
process.on("uncaughtException", console.error);
process.on("unhandledRejection", console.error);
import { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage } from '@whiskeysockets/baileys';
import Pino from "pino";
import path from 'path';
import fs from 'fs';
import { fileTypeFromBuffer } from 'file-type';
import got from "got";
import readline from 'readline';
import qrcode from "qrcode-terminal";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import functions from './functions.js';
const system = 'انت مساعد ذكي إسمك لولا المعاناة Ai ، اسمك مقتبس من شخصية افتراضية مغربية ، انت تتكلم جميع اللغات و تحب الدارجة المغربية ، لديك مهارات كثيرة كالتخيل والرسم وتحليل الصور والاحابة عن محتواها ، حاول في كل  نهاية اي رسالة  ان ترجع للسطر مرتين ثم اكتب `follow us` : \n https://whatsapp.com/channel/0029Vaz5bJz3mFY2ccGBev1n';
const API_KEY = 'AIzaSyBmqtJbclNfA8NP_YDCqDXKZeTcGAR96pI'; // Source https://aistudio.google.com/app/apikey
const apikey = 'yzgpt-sc4tlKsMRdNMecNy' // Source https://yanzgpt.my.id/
const genAI = new GoogleGenerativeAI(API_KEY);
const fileManager = new GoogleAIFileManager(API_KEY);

let usePairingCode = true;
const logger = Pino({ level: "silent" });
const question = (text) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
        });
        return new Promise((resolve) => rl.question(text, resolve));
    };
async function startSock() {
    const { version } = await fetchLatestBaileysVersion();
    const authPath = './session/auth_info';
    const authDir = path.dirname(authPath);
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }
    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    let sock = makeWASocket({
        version,
        printQRInTerminal: true,
        logger,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        shouldSyncHistoryMessage: msg => {
            console.log(`\x1b[32mLoading Chat [${msg.progress}%]\x1b[39m`);
            return !!msg.syncType;
        }
    });
    if (usePairingCode && !sock.authState.creds.registered) {
        await functions.delay(3000);
        const phoneNumber = await question('\x1b[46m\x1b[37m\nMasukan Nomer kamu! (Example : 62813xxx) :\x1b[0m\n');
        let code = await sock.requestPairingCode(phoneNumber);
            code = code.match(/.{1,4}/g)?.join("-") || code;
            console.log("\x1b[42m\x1b[30m Your Pairing \x1b[0m : \x1b[37m" + code + "\x1b[0m")
    }
    sock.ev.on('creds.update', saveCreds);
    sock.downloadMediaMessage = async (m) => {
        const message = (m.msg || m).mimetype || '';
        const type = m.mtype ? m.mtype.replace(/Message|WithCaption/gi, '') : message.split('/')[0];
        const data = await downloadContentFromMessage(m, type);
        let buffer = Buffer.from([]);
        for await (let i of data) buffer = Buffer.concat([buffer, i]);
        return buffer;
    };
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("Scan this QR Code!");
			qrcode.generate(qr, {small: true});
        }

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Connection closed, reconnecting:', shouldReconnect);
            if (shouldReconnect) startSock();
        } else if (connection === 'open') {
            console.log('Connection opened successfully');
        }
    });

    let processingQueue = Promise.resolve();
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (msg.key.remoteJid === 'status@broadcast') return;
        if (!msg.message || msg.key.fromMe) return;
        const type = Object.keys(msg.message)[0];
        if (type === "protocolMessage") return;

        await sock.readMessages([msg.key]);
        const isGroup = msg.key.remoteJid.endsWith("@g.us");
        const sender = isGroup ? msg.key.participant : msg.key.remoteJid;
        const isQuoted = !!msg.message[type].contextInfo?.quotedMessage;
        const textMessage = msg.message.conversation || 
                            msg.message.extendedTextMessage?.text ||
                            msg.message.imageMessage?.caption ||
                            msg.message.videoMessage?.caption ||
                            msg.message.documentMessage?.caption ||
                            msg.message.interactiveMessage?.contentText ||
                            "";

        const media = isQuoted ? msg.message.extendedTextMessage?.contextInfo?.quotedMessage[type] : msg.message[type];
        const isMedia = !!msg.message[type].mimetype || !!msg.message[type].thumbnailDirectPath || msg.message[type].header?.hasMediaAttachment || false;
        const ephemeralExpiration = isQuoted ? msg.message[type].contextInfo?.expiration || 1000000 : 1000000;
        const buffer = isMedia ? await sock.downloadMediaMessage(media) : null;
        if (textMessage) {
            processingQueue = processingQueue.then(async () => {
                await sock.sendMessage(sender, { react: { text: '🔍', key: msg.key } });
                await sock.sendPresenceUpdate('composing', sender);
                
                try {
                    const reply = await gpt(textMessage, sender, buffer);
                    console.log(`
<=================================>
📜 Name         : ${msg.pushName}
📩 From         : ${sender}
📦 Type         : ${type}
💬 Message      : ${textMessage}
<=================================>
💬 Reply Bot    : ${reply.content}
<=================================>`);
                    if (typeof reply.content === 'string') {
                        await sock.sendMessage(sender, { 
                            text: reply.content, mentions: [sender] }, {
                            ephemeralExpiration
                        });
                        if (Array.isArray(reply.image)) {
                            console.log('Sending media: \n', reply.image);
                            for (const url of reply.image) {
                                    await sock.sendMessage(sender, {
                                        image: { url },
                                        mimetype: 'image/jpeg',
                                        caption: `*Link:*\n${url}`}, {
                                        ephemeralExpiration
                                    });
                                await functions.delay(2000);
                            }
                        }
                    sock.sendMessage(sender, { react: { text: '✅', key: msg.key } });
                    } else throw ("I'm sorry, I can't do that.");
                } catch (error) {
                    await sock.sendMessage(sender, { 
                        text: typeof error === 'object' ? JSON.stringify(error) : error, mentions: [sender] }, {
                        ephemeralExpiration
                    });
                    await sock.sendMessage(sender, { react: { text: '❌', key: msg.key } });
                    console.error("Error processing message: ", error);
                }
            });
        }
    });
}

async function gpt(msg, filePath, buffer) {
    return new Promise(async (resolve) => {
        const fullPath = `session/users/${filePath}.json`;
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        let session = fs.existsSync(fullPath)
            ? JSON.parse(fs.readFileSync(fullPath, 'utf-8'))
            : [];

        if (buffer) {
            const modelConfig = {
                model: "gemini-1.5-flash",
                systemInstruction: system
            };
            const model = genAI.getGenerativeModel(modelConfig);

            try {
                const fileType = await fileTypeFromBuffer(buffer);
                if (!fileType) throw new Error("Unknown file type.");

                const mimeType = fileType.mime;
                const tempFilePath = path.join("session", `temp_${Date.now()}`);
                fs.writeFileSync(tempFilePath, buffer);
                const fileUpload = await fileManager.uploadFile(tempFilePath, {
                    mimeType,
                    displayName: `temp_file_${Date.now()}`
                });
                fs.unlinkSync(tempFilePath);
                if (fileUpload.error) throw new Error(`Error uploading file: ${fileUpload.error.message}`);
                if (mimeType.startsWith("video")) {
                    let file = await fileManager.getFile(fileUpload.file.name);
                    while (file.state === FileState.PROCESSING) {
                        await new Promise(resolve => setTimeout(resolve, 10_000));
                        file = await fileManager.getFile(fileUpload.file.name);
                    }
                    if (file.state === FileState.FAILED) throw new Error("Video processing failed.");
                }
                const result = await model.generateContent([
                    { fileData: { mimeType: fileUpload.file.mimeType, fileUri: fileUpload.file.uri } },
                    { text: msg }
                ]);
                session.push({ role: 'user', content: msg });
                session.push({ role: 'assistant', content: result.response.text() });
                if (session.length > 10) {
                    session.shift();
                }
                resolve(result.response.text());
            } catch (err) {
                console.error(err);
                resolve(err.status === 400
                    ? "This type of document cannot be processed, please upload another document" : "The AI server failed to respond, please rephrase the question.");
            }
        } else {
            if (!session.length) {
                session.push({ role: 'system', content: system });
            }
            session.push({ role: 'user', content: msg });

            try {
                const response = await got.post('https://api.yanzgpt.my.id/v1/chat', {
                    headers: {
                        'Authorization': `Bearer ${apikey}`,
                        'Content-Type': 'application/json'
                    },
                    json: {
                        messages: [
                            {
                                role: "system",
                                content: system
                            },
                            {
                                role: 'user',
                                content: msg
                            }
                        ],
                        model: 'yanzgpt-revolution-25b-v3.0',
                        temperature: 0.7,
                        max_tokens: 1024
                    },
                    responseType: 'json'
                });
                const reply = response.body.choices[0].message;
                session.push({ role: 'assistant', content: reply.content });
                if (session.length > 10) {
                    session.shift();
                }
                fs.writeFileSync(fullPath, JSON.stringify(session, null, 2), 'utf-8');
                resolve(reply);
            } catch (err) {
                console.error(err);
                resolve("Sorry, AI failed to respond. Please rephrase the question.");
            }
        }
    });
}

startSock();
