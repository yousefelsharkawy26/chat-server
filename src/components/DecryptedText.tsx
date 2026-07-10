import React, { useEffect, useState } from "react";
import { Lock, Unlock } from "lucide-react";
import { decryptMessage } from "../lib/crypto";

interface DecryptedTextProps {
  text: string;
  encryptedText?: string;
  isEncrypted?: boolean;
  room: string;
  renderText: (text: string) => React.ReactNode;
}

export function DecryptedText({ text, encryptedText, isEncrypted, room, renderText }: DecryptedTextProps) {
  const [decrypted, setDecrypted] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);

  useEffect(() => {
    if (isEncrypted && encryptedText) {
      setIsDecrypting(true);
      decryptMessage(encryptedText, room).then((result) => {
        setDecrypted(result);
        setIsDecrypting(false);
      });
    } else {
      setDecrypted(null);
    }
  }, [isEncrypted, encryptedText, room]);

  if (!isEncrypted) {
    return <>{renderText(text)}</>;
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-emerald-500/60 mb-1">
        {isDecrypting ? (
          <Lock className="w-3 h-3 animate-pulse" />
        ) : (
          <Unlock className="w-3 h-3" />
        )}
        End-to-End Encrypted
      </div>
      <p className="whitespace-pre-wrap break-words italic opacity-90">
        {isDecrypting ? "Decrypting..." : renderText(decrypted || text)}
      </p>
    </div>
  );
}
