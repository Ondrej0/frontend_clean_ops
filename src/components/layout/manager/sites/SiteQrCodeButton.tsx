import { useEffect, useState } from "react";
import { Download, LoaderCircle, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateSiteQrCode } from "@/lib/siteQrCode";

const buttonClassName = "inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100";

function SiteQrCodePreview({ siteId }: { siteId: string }) {
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let active = true;
        generateSiteQrCode(siteId)
            .then((url) => { if (active) setImageUrl(url); })
            .catch(() => { if (active) setError(true); });
        return () => { active = false; };
    }, [siteId, attempt]);

    if (error) {
        return <div className="space-y-4 text-center">
            <p role="alert" className="text-red-700">Unable to generate the QR code. Please try again.</p>
            <button type="button" className={buttonClassName} onClick={() => { setError(false); setAttempt((value) => value + 1); }}>Try again</button>
        </div>;
    }

    if (!imageUrl) {
        return <div role="status" className="flex min-h-64 items-center justify-center gap-2 text-slate-500"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Generating QR code…</div>;
    }

    return <>
        <img src={imageUrl} alt={`QR code containing Site ID ${siteId}`} width={1024} height={1024} className="mx-auto aspect-square w-full max-w-72 rounded-lg bg-white" />
        <p className="break-all text-center text-sm text-slate-500"><span className="font-semibold">Site ID:</span> {siteId}</p>
        <a href={imageUrl} download={`site-${siteId}-qr-code.png`} className={buttonClassName}><Download aria-hidden="true" className="size-4" />Download PNG</a>
    </>;
}

export function SiteQrCodeButton({ siteId }: { siteId: string }) {
    const [open, setOpen] = useState(false);

    return <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger className={`${buttonClassName} w-full`}><QrCode aria-hidden="true" className="size-5" />Generate QR code</DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto bg-white p-6 text-slate-900 sm:max-w-md">
            <DialogTitle className="pr-6 text-xl font-bold">Site QR code</DialogTitle>
            <DialogDescription className="text-slate-500">Scan this code to read the Site ID. Download the PNG to save or print it.</DialogDescription>
            {open && <SiteQrCodePreview key={siteId} siteId={siteId} />}
        </DialogContent>
    </Dialog>;
}
