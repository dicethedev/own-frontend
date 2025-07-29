import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UnconnectedActionsCard } from "@/components/pool/lp/UnconnectedActionsCard";

// Mock ConnectButton from RainbowKit
jest.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({
      children,
    }: {
      children: (props: { openConnectModal: () => void }) => React.ReactNode;
    }) => {
      const mockProps = {
        openConnectModal: jest.fn(),
      };
      return children(mockProps);
    },
  },
}));

jest.mock("@/components/ui/BaseComponents", () => ({
  Card: ({
    children,
    className,
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className}>{children}</div>
  ),
}));

describe("UnconnectedActionsCard", () => {
  it("renders correctly with connect wallet message", () => {
    render(<UnconnectedActionsCard />);

    expect(
      screen.getByText(
        "Connect your wallet to manage the liquidity of this pool"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect Wallet" })
    ).toBeInTheDocument();
  });

  it("applies correct styling classes", () => {
    const { container } = render(<UnconnectedActionsCard />);

    expect(container.querySelector(".bg-white\\/10")).toBeInTheDocument();
    expect(container.querySelector(".border-gray-800")).toBeInTheDocument();
    expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
  });

  it("renders connect button with correct styling", () => {
    render(<UnconnectedActionsCard />);

    const button = screen.getByRole("button", { name: "Connect Wallet" });
    expect(button).toHaveClass("bg-blue-600");
    expect(button).toHaveClass("hover:bg-blue-700");
    expect(button).toHaveClass("text-white");
    expect(button).toHaveClass("font-medium");
    expect(button).toHaveClass("rounded-md");
  });

  it("centers content correctly", () => {
    const { container } = render(<UnconnectedActionsCard />);

    expect(container.querySelector(".text-center")).toBeInTheDocument();
    expect(container.querySelector(".justify-center")).toBeInTheDocument();
  });

  it("uses RainbowKit Custom component pattern correctly", () => {
    // This test ensures the component structure matches RainbowKit's expected pattern
    render(<UnconnectedActionsCard />);

    // If the component renders without error and shows the button,
    // it means the Custom component pattern is working correctly
    expect(
      screen.getByRole("button", { name: "Connect Wallet" })
    ).toBeInTheDocument();
  });
});
