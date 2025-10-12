// samuel-skean: This was copied and pasted from ChatGPT, with minimal modifications. I have audited it, but this is also the first node code I've written.

import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "path";
import QRCode from "qrcode";
import sharp from "sharp";
import { qrCodeUrls } from "../src/qrCodeUrls";

async function generate() {
  const qrCodeDirectoryPath = resolve(__dirname, "../dist/public/qr/");
  rmSync(qrCodeDirectoryPath, { recursive: true, force: true });
  mkdirSync(qrCodeDirectoryPath);

  const discordLogoFile = resolve(__dirname, "../assets/discord-icon-svgrepo-com.svg");
  const discordLogo = sharp(discordLogoFile);
  const { width: discordLogoWidth, height: discordLogoHeight } = await discordLogo.metadata();
  console.log(discordLogoHeight);

  for (const [name, url] of Object.entries(qrCodeUrls)) {
    const qrCodeFile = resolve(__dirname, `../dist/public/qr/${name}.png`);
    const qrCode = sharp(await QRCode.toBuffer(url, { type: "png", errorCorrectionLevel: "H" }));
    const { width: originalQrCodeWidth, height: originalQrCodeHeight } = await qrCode.metadata();

    // For who knows what reason, the "qrcode" library generates images where each "QR code pixel" is 4 x 4 pixels of the image. So, first we resize it down.
    const [qrCodeWidth, qrCodeHeight] = [originalQrCodeWidth / 4, originalQrCodeHeight / 4];
    const qrCodeWithGap = await qrCode
      .resize({ width: qrCodeWidth, kernel: sharp.kernel.nearest })
      .composite([
        {
          input: {
            create: {
              width: Math.ceil(qrCodeWidth / 4),
              height: Math.ceil(qrCodeHeight / 4),
              channels: 4,
              background: "white",
            },
          },
        },
      ])
      .toBuffer();
    await sharp(qrCodeWithGap)
      .resize({ width: 5 * discordLogoWidth, kernel: sharp.kernel.nearest })
      .composite([
        {
          input: await discordLogo.grayscale().threshold(200).toBuffer(),
        },
      ])
      .png()
      .toFile(qrCodeFile);
    console.log(`✅ QR code generated: ${qrCodeFile}`);
  }
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
