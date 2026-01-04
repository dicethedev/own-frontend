import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { UnconnectedActionsCard } from "@/components/pool/common/UnconnectedActionsCard";

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
    ...props
  }: React.PropsWithChildren<{ className?: string }>) => (
    <div className={className} {...props}>
      {children}
    </div>
  ),
}));

// Mock lucide-react Wallet icon
jest.mock("lucide-react", () => ({
  Wallet: () => <span data-testid="wallet-icon">💼</span>,
}));

describe("UnconnectedActionsCard", () => {
  it("renders correctly with connect wallet message", () => {
    render(<UnconnectedActionsCard />);

    expect(screen.getAllByText("Connect Wallet").length).toBeGreaterThan(0);
    expect(
      screen.getByText("Connect your wallet to access pool actions.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Connect Wallet/i })
    ).toBeInTheDocument();
  });

  it("renders the wallet icon", () => {
    render(<UnconnectedActionsCard />);

    expect(screen.getAllByTestId("wallet-icon").length).toBeGreaterThan(0);
  });

  it("has the correct data-testid attribute", () => {
    render(<UnconnectedActionsCard />);

    expect(screen.getByTestId("unconnected-actions-card")).toBeInTheDocument();
  });

  it("uses RainbowKit Custom component pattern correctly", () => {
    // This test ensures the component structure matches RainbowKit's expected pattern
    render(<UnconnectedActionsCard />);

    // If the component renders without error and shows the button,
    // it means the Custom component pattern is working correctly
    expect(
      screen.getByRole("button", { name: /Connect Wallet/i })
    ).toBeInTheDocument();
  });
});
