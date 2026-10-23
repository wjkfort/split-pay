import { useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { CloseIcon, CopyIcon } from './Icons';

export default function ShareDialog({
  open,
  link,
  onClose,
  onCopy,
}: {
  open: boolean;
  link: string;
  onClose: () => void;
  onCopy: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="share-dialog"
      aria-labelledby="qr-title"
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="qr-card">
        <button type="button" className="dialog-close" aria-label="Close QR code" onClick={onClose}>
          <CloseIcon size={18} />
        </button>
        <p className="qr-brand">dinner/split</p>
        <h2 id="qr-title">Open the check</h2>
        <p className="qr-copy">Point a phone camera at the code. The whole split travels inside the link.</p>
        <div className="qr-frame">
          <QRCodeSVG
            value={link}
            size={232}
            level="M"
            marginSize={0}
            bgColor="#f3ead8"
            fgColor="#17130e"
            title="QR code for this shared check"
          />
        </div>
        <button type="button" className="btn btn-ghost qr-copy-button" onClick={onCopy}>
          <CopyIcon size={17} />
          Copy link
        </button>
        <p className="qr-note">No app. No account. No database.</p>
      </div>
    </dialog>
  );
}
