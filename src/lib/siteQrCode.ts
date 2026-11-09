import QRCode from "qrcode";

export function generateSiteQrCode(siteId: string): Promise<string> {
    return QRCode.toDataURL(siteId, {
        type: "image/png",
        width: 1024,
        margin: 4,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
    });
}
