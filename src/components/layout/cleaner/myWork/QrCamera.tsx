import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Camera, CameraOff, LoaderCircle, ScanLine } from "lucide-react";
import { scannedSiteId } from "@/lib/attendance";

function cameraError(cause: unknown): string {
    if (cause instanceof DOMException) {
        if (cause.name === "NotAllowedError" || cause.name === "SecurityError") return "Camera access is blocked. Allow camera access in your browser settings, then try again.";
        if (cause.name === "NotFoundError" || cause.name === "OverconstrainedError") return "No camera was found. Open My Work on a device with a camera.";
        if (cause.name === "NotReadableError") return "Your camera is being used by another app. Close it there, then try again.";
    }
    return "We couldn't start your camera. Check your camera permissions and try again.";
}

export function QrCamera({ onScan }: { onScan: (siteId: string) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [hint, setHint] = useState("");
    const scan = useEffectEvent(onScan);

    useEffect(() => {
        const video = videoRef.current!;
        let disposed = false;
        let stopped = false;
        let stream: MediaStream | undefined;
        let timer: ReturnType<typeof setTimeout>;

        function stop() {
            stopped = true;
            clearTimeout(timer);
            stream?.getTracks().forEach((track) => { track.onended = null; track.stop(); });
            video.srcObject = null;
        }

        async function start() {
            try {
                if (!window.isSecureContext) {
                    setError("Camera scanning needs a secure connection. Open this app using HTTPS, then try again.");
                    return;
                }
                if (!navigator.mediaDevices?.getUserMedia) {
                    setError("This browser cannot access a camera. Try opening My Work in your phone's browser.");
                    return;
                }
                // Load the decoder only when the scanner is opened; works without BarcodeDetector.
                const { default: jsQR } = await import("jsqr");
                if (disposed || stopped) return;
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                });
                if (disposed || stopped) { stop(); return; }
                video.srcObject = stream;
                await video.play();
                if (disposed || stopped) { stop(); return; }
                setReady(true);
                stream.getVideoTracks().forEach((track) => {
                    track.onended = () => {
                        stop();
                        if (!disposed) setError("The camera was disconnected. Try again to resume scanning.");
                    };
                });
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d", { willReadFrequently: true });
                if (!context) throw new Error("Canvas unavailable");

                function readFrame() {
                    if (disposed || stopped) return;
                    try {
                        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0) {
                            const scale = Math.min(1, 800 / Math.max(video.videoWidth, video.videoHeight));
                            canvas.width = Math.round(video.videoWidth * scale);
                            canvas.height = Math.round(video.videoHeight * scale);
                            context!.drawImage(video, 0, 0, canvas.width, canvas.height);
                            const frame = context!.getImageData(0, 0, canvas.width, canvas.height);
                            const code = jsQR(frame.data, frame.width, frame.height, { inversionAttempts: "attemptBoth" });
                            if (code) {
                                const siteId = scannedSiteId(code.data);
                                if (siteId) {
                                    // Stop before handing off, so repeated frames cannot send duplicate requests.
                                    stop();
                                    scan(siteId);
                                    return;
                                }
                                setHint("That isn't a site QR code. Scan the code displayed at your site.");
                            }
                        }
                        timer = setTimeout(readFrame, 180);
                    } catch {
                        stop();
                        setError("The camera preview was interrupted. Try again to resume scanning.");
                    }
                }
                readFrame();
            } catch (cause) {
                stop();
                if (!disposed) setError(cameraError(cause));
            }
        }

        function onVisibility() {
            if (document.visibilityState === "hidden" && !stopped) {
                stop();
                setError("Camera paused while you were away. Try again to resume scanning.");
            }
        }
        void start();
        document.addEventListener("visibilitychange", onVisibility);
        return () => {
            disposed = true;
            stop();
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-950 sm:min-h-80">
            <video ref={videoRef} autoPlay playsInline muted aria-label="Live camera preview for scanning the site QR code" className={`absolute inset-0 size-full object-cover ${error ? "hidden" : ""}`} />
            {error ? (
                <div role="alert" className="relative m-auto flex max-w-sm flex-col items-center px-6 py-12 text-center">
                    <CameraOff className="mb-4 size-10 text-slate-400" aria-hidden="true" />
                    <p className="text-base font-semibold text-white">Camera unavailable</p>
                    <p className="mt-2 leading-relaxed text-slate-300">{error}</p>
                </div>
            ) : (
                <div className="pointer-events-none relative flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-4 py-2 text-xs font-medium text-white backdrop-blur">
                        {ready ? <Camera className="size-4 text-emerald-300" aria-hidden="true" /> : <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
                        <span role="status">{ready ? "Camera ready" : "Starting camera…"}</span>
                    </div>
                    <div className="relative aspect-square w-56 max-w-full rounded-3xl border border-white/25 shadow-[0_0_0_999px_rgba(2,6,23,0.25)] sm:w-60" aria-hidden="true">
                        <span className="absolute -top-0.5 -left-0.5 size-10 rounded-tl-3xl border-t-4 border-l-4 border-emerald-400" />
                        <span className="absolute -top-0.5 -right-0.5 size-10 rounded-tr-3xl border-t-4 border-r-4 border-emerald-400" />
                        <span className="absolute -bottom-0.5 -left-0.5 size-10 rounded-bl-3xl border-b-4 border-l-4 border-emerald-400" />
                        <span className="absolute -right-0.5 -bottom-0.5 size-10 rounded-br-3xl border-r-4 border-b-4 border-emerald-400" />
                        {!ready && <ScanLine className="absolute top-1/2 left-1/2 size-12 -translate-1/2 text-white/50" />}
                    </div>
                    <p role="status" className="z-10 max-w-xs rounded-xl bg-slate-950/75 px-4 py-3 text-center text-sm text-white backdrop-blur">{hint || "Position the site's QR code inside the frame. It will scan automatically."}</p>
                </div>
            )}
        </div>
    );
}
