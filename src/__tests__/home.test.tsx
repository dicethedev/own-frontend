import { render, screen } from "@testing-library/react";
import { HomeView } from "@/app/views";
import "@testing-library/jest-dom";

describe("Home Page", () => {
  it("renders the hero heading", () => {
    render(<HomeView />);
    const heading = screen.getByRole("heading", {
      name: /Own Real Assets On-Chain/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders the Learn More link", () => {
    render(<HomeView />);
    const learnMoreLink = screen.getByRole("link", { name: /Learn More/i });
    expect(learnMoreLink).toHaveAttribute(
      "href",
      expect.stringContaining("gitbook")
    );
  });
});
