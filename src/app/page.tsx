import { type NextPage } from "next";
import { HomeNavbar } from "@/components/HomeNavbar";
import { Footer } from "@/components/Footer";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import Link from "next/link";

const Home: NextPage = () => {
  return (
    <main className="min-h-screen flex flex-col">
      <BackgroundEffects />
      <HomeNavbar />

      {/* Hero Section - takes available space but leaves room for footer */}
      <section className="flex-1 flex items-center justify-center px-6 pt-2">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tighter mb-8 leading-none">
            Own Real Assets
            <br />
            On-Chain
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            First fully permissionless synthetic stock issuance protocol. <br />
            Users can mint synthetic stocks and LPs earn yield for backing these
            assets.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://t.me/+EX6VZh6rrPc5YmI9"
              target="_blank"
              className="px-8 py-4 bg-blue-500 rounded-xl hover:scale-105 transition-transform text-center inline-block"
            >
              Join the community
            </Link>
            <Link
              href="https://own-protocol.gitbook.io/docs"
              target="_blank"
              className="px-8 py-4 bg-white/10 rounded-xl hover:scale-105 transition-transform text-center inline-block"
            >
              Learn More →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Home;
