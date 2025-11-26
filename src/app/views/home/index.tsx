import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { BackgroundEffects } from "@/components/BackgroundEffects";
import AI7AutoInvestPage from "../ai7";

export default function HomeView() {
  return (
    <main className="min-h-screen bg-gray-900 flex flex-col">
      <BackgroundEffects />
      <Navbar />
      <AI7AutoInvestPage />
      <Footer />
    </main>
  );
}
