import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-sm text-gray-400">© 2025 Own Protocol</div>
          <div className="flex gap-8">
            <Link
              href="https://own-protocol.gitbook.io/docs"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              Docs
            </Link>
            <Link
              href="https://x.com/iownco"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              X (Twitter)
            </Link>
            <Link
              href="https://t.me/+EX6VZh6rrPc5YmI9"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              Telegram
            </Link>
            <Link
              href="https://github.com/own-protocol/own-contracts"
              target="_blank"
              className="text-sm text-gray-400 hover:underline"
            >
              Github
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
