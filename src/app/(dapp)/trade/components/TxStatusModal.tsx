'use client'
interface TxStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  txHash?: `0x${string}` | null;
  errorMessage?: string | null;
}

export function TxStatusModal({
  isOpen,
  onClose,
  isPending,
  isSuccess,
  isError,
  txHash,
  errorMessage,
}: TxStatusModalProps) {
  if (!isOpen) return null;

  let statusText = "";
  let statusClass = "text-gray-400";

  if (isPending) {
    statusText = "Your transaction is being processed...";
    statusClass = "text-yellow-300";
  } else if (isSuccess) {
    statusText = "Transaction confirmed!";
    statusClass = "text-green-400";
  } else if (isError || errorMessage) {
    statusText = "Transaction failed.";
    statusClass = "text-red-400";
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50">
      <div className="rounded-xl bg-white/5 p-6 shadow-lg w-[400px] space-y-4">
        <h2 className="text-lg font-semibold text-white">Transaction Status</h2>

        <p className={`${statusClass} text-sm`}>
          {statusText}
        </p>

        {isPending && (
          <p className="text-sm text-gray-400 mt-1">
            Waiting for blockchain confirmation...
          </p>
        )}

        {isSuccess && txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-green-300 text-sm"
          >
            View on explorer
          </a>
        )}

        {(isError || errorMessage) && errorMessage && (
          <p className="text-red-400 text-sm whitespace-pre-line mt-2">
            {errorMessage}
          </p>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/10 text-gray-300 hover:bg-white/20 text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
