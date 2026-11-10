import assert from "node:assert/strict";
import { test } from "node:test";
import QRCode from "qrcode";
import { generateSiteQrCode } from "../src/lib/siteQrCode.ts";

const siteId = "a3f87517-670f-456a-bd92-47abf697bdf0";

test("site QR generation passes the plain site ID and produces a downloadable 1024px PNG", async (context) => {
    const render = QRCode.toDataURL;
    const generator = context.mock.method(QRCode, "toDataURL", (text: string, options: QRCode.QRCodeToDataURLOptions) => {
        // A URL or JSON wrapper would be rejected by the attendance scanner.
        assert.equal(text, siteId);
        return render(text, options);
    });
    const url = await generateSiteQrCode(siteId);
    assert.match(url, /^data:image\/png;base64,/);
    const png = Buffer.from(url.split(",")[1], "base64");
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(png.toString("ascii", 12, 16), "IHDR");
    assert.equal(png.readUInt32BE(16), 1024);
    assert.equal(png.readUInt32BE(20), 1024);
    assert.equal(generator.mock.callCount(), 1);
});

test("QR rendering failures reject so the preview can offer a retry", async (context) => {
    const failure = new Error("Unable to render QR image");
    context.mock.method(QRCode, "toDataURL", async () => { throw failure; });
    await assert.rejects(generateSiteQrCode(siteId), (error) => error === failure);
});
