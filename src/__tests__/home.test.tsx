import { render, screen } from "@testing-library/react";
import AI7AutoInvestPage from "@/app/views/ai7";
import "@testing-library/jest-dom";

describe("Home Page", () => {
  it("renders the hero heading", () => {
    render(<AI7AutoInvestPage />);
    const heading = screen.getByRole("heading", {
      name: /Auto-Invest in the Magnificent Seven/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders the explore link", () => {
    render(<AI7AutoInvestPage />);
    const exploreLink = screen.getByRole("link", {
      name: /Explore the Protocol/i,
    });
    expect(exploreLink).toHaveAttribute(
      "href",
      expect.stringContaining("protocol")
    );
  });
});
