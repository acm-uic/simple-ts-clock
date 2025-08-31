// samuel-skean: This was copied and pasted from ChatGPT, with minimal modifications. I have audited it, but this is also the first node code I"ve written.
import QRCode from "qrcode";
import { mkdirSync, readFileSync, rmSync } from "fs";
import { resolve } from "path";
import { qrCodeUrls } from "../src/qrCodeUrls";


async function generate() {
    const qrCodeDirectoryPath = resolve(__dirname, "../dist/public/qr/");

    rmSync(qrCodeDirectoryPath, { recursive: true, force: true });
    mkdirSync(qrCodeDirectoryPath);
    for (const [ name, url ] of Object.entries(qrCodeUrls)) {
        const file = resolve(__dirname, `../dist/public/qr/${name}.svg`);
        QRCode.toFile(file, url, { type: "svg" });
        console.log(`✅ QR code generated: ${file}`);
    }
}

generate().catch((err) => {
    console.error(err);
    process.exit(1);
});
