dist/public/qr/.qr-code-fake-target: src/qrCodeUrls.ts
	npx ts-node scripts/generate-qr.ts
	touch dist/public/qr/.qr-code-fake-target
