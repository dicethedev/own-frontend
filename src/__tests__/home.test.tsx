import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import "@testing-library/jest-dom";

describe("Home Page", () => {
  it("renders the hero heading", () => {
    render(<Home />);
    const heading = screen.getByRole("heading", {
      name: /Own Real Assets On-Chain/i,
    });
    expect(heading).toBeInTheDocument();
  });

  it("renders the Join the community button", () => {
    render(<Home />);
    const joinBtn = screen.getByRole("link", { name: /Join the community/i });
    expect(joinBtn).toHaveAttribute("href", expect.stringContaining("t.me"));
  });

  it("renders the Learn More link", () => {
    render(<Home />);
    const learnMoreLink = screen.getByRole("link", { name: /Learn More/i });
    expect(learnMoreLink).toHaveAttribute(
      "href",
      expect.stringContaining("gitbook")
    );
  });
});
