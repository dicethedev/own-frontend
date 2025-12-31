import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import AI7InvestPage from "../ai7";

export default function HomeView() {
  return (
    <main className="min-h-screen flex flex-col">
      <BackgroundEffects />
      <Navbar />
      <AI7InvestPage />
      <Footer />
    </main>
  );
}
