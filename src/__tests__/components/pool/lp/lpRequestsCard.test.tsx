import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LPRequestsCard } from "@/components/pool/lp/LPRequestsCard";
import { mockPool } from "./lpPage.test";
import { LPData, LPRequestType } from "@/types/lp";

// Mock
jest.mock("viem", () => ({
  formatUnits: (val: bigint, decimals: number) =>
    (Number(val) / Math.pow(10, decimals)).toString(),
}));

const TIMESTAMP = BigInt(Math.floor(Date.now() / 1000));

const baseLPData: LPData = {
  isLP: true,
  isLoading: false,
  error: null,
  lpPosition: null,
  lpRequest: null,
};

const mockLPRequestBase = {
  id: "lp-1",
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
  requestAmount: BigInt(1000000), // 1 USDC with 6 decimals
  requestCycle: BigInt(3),
};

describe("LPRequestsCard", () => {
  it("renders loading state", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{ ...baseLPData, isLoading: true }}
      />
    );
    expect(screen.getByText("LP Requests")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{ ...baseLPData, error: new Error("Network fail") }}
      />
    );
    expect(screen.getByText(/Error loading request/i)).toBeInTheDocument();
    expect(screen.getByText(/Network fail/i)).toBeInTheDocument();
  });

  it("renders empty state when no active request", () => {
    render(<LPRequestsCard pool={mockPool} lpData={baseLPData} />);
    expect(
      screen.getByText(/No pending liquidity request/i)
    ).toBeInTheDocument();
  });

  it("renders add liquidity request in current cycle", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{
          ...baseLPData,
          lpRequest: {
            ...mockLPRequestBase,
            requestType: LPRequestType.ADDLIQUIDITY,
            requestCycle: BigInt(5), // same as current cycle
          },
        }}
      />
    );
    expect(screen.getByText(/Add Liquidity/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Request submitted in current cycle/i)
    ).toBeInTheDocument();
  });

  it("renders reduce liquidity request processed", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{
          ...baseLPData,
          lpRequest: {
            ...mockLPRequestBase,
            requestType: LPRequestType.REDUCELIQUIDITY,
            requestCycle: BigInt(3), // less than current cycle
          },
        }}
      />
    );
    expect(screen.getByText(/Reduce Liquidity/i)).toBeInTheDocument();
    expect(screen.getByText(/has been processed/i)).toBeInTheDocument();
  });

  it("renders pending from previous cycle", () => {
    const poolPrevCycle = { ...mockPool, currentCycle: 3 };
    render(
      <LPRequestsCard
        pool={poolPrevCycle}
        lpData={{
          ...baseLPData,
          lpRequest: {
            ...mockLPRequestBase,
            requestType: LPRequestType.ADDLIQUIDITY,
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    expect(
      screen.getByText(
        /Request submitted in current cycle. It will be processed in the next cycle./i
      )
    ).toBeInTheDocument();
  });

  it("renders liquidation request with liquidator info", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{
          ...baseLPData,
          lpRequest: {
            ...mockLPRequestBase,
            requestType: LPRequestType.LIQUIDATE,
            liquidator: "0xLiquidator",
            requestCycle: BigInt(5), // current cycle
          },
        }}
      />
    );
    expect(screen.getAllByText(/Liquidation/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/0xLiquidator/i)).toBeInTheDocument();
    expect(
      screen.getByText(/position is being liquidated/i)
    ).toBeInTheDocument();
  });

  it("renders unknown request type gracefully", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{
          ...baseLPData,
          lpRequest: {
            ...mockLPRequestBase,
            requestType: LPRequestType.NONE,
            requestCycle: BigInt(3),
          },
        }}
      />
    );
    expect(
      screen.getByText(/No pending liquidity requests/i)
    ).toBeInTheDocument();
  });

  it("handles BigInt formatting correctly", () => {
    render(
      <LPRequestsCard
        pool={mockPool}
        lpData={{
          ...baseLPData,
          lpRequest: {
            ...mockLPRequestBase,
            requestType: LPRequestType.ADDLIQUIDITY,
            requestAmount: BigInt(2000000), // 2 USDC
            requestCycle: BigInt(5),
          },
        }}
      />
    );
    expect(screen.getByText("2 USDC")).toBeInTheDocument();
  });
});
