import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LPPositionsCard } from "@/components/pool/lp/LPPositionsCard";
import { mockPool, mockLPData } from "./lpPage.test";
import { formatUnits } from "viem";
import { formatTokenAmount } from "@/utils";

// Mocks
jest.mock("viem", () => ({
  formatUnits: jest.fn((val: bigint, decimals: number) =>
    (Number(val) / 10 ** decimals).toString()
  ),
}));

jest.mock("@/utils", () => ({
  formatTokenAmount: jest.fn((val: bigint, decimals: number) =>
    (Number(val) / 10 ** decimals).toString()
  ),
}));

describe("LPPositionsCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders loading state", () => {
    render(
      <LPPositionsCard pool={mockPool} lpData={{ ...mockLPData, isLoading: true }} />
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders error state", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{ ...mockLPData, error: new Error("Fetch failed") }}
      />
    );
    expect(screen.getByText(/Error loading LP positions/i)).toBeInTheDocument();
    expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument();
  });

  it("renders empty state when not an LP", () => {
    render(
      <LPPositionsCard pool={mockPool} lpData={{ ...mockLPData, isLP: false }} />
    );
    expect(screen.getByText(/No active LP positions/i)).toBeInTheDocument();
  });

  it("renders empty state when lpPosition is null", () => {
    render(
      <LPPositionsCard pool={mockPool} lpData={{ ...mockLPData, lpPosition: null }} />
    );
    expect(screen.getByText(/No active LP positions/i)).toBeInTheDocument();
  });

  it("renders empty state when commitment is zero", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{
          ...mockLPData,
          lpPosition: { ...mockLPData.lpPosition!, liquidityCommitment: BigInt(0) },
        }}
      />
    );
    expect(screen.getByText(/No active LP positions/i)).toBeInTheDocument();
  });

  it("renders a valid LP position with Healthy status", () => {
    render(<LPPositionsCard pool={mockPool} lpData={mockLPData} />);
    expect(screen.getByText("Liquidity Commitment")).toBeInTheDocument();
    expect(formatUnits).toHaveBeenCalledWith(
      mockLPData.lpPosition!.liquidityCommitment,
      mockPool.reserveTokenDecimals
    );
    expect(formatTokenAmount).toHaveBeenCalledWith(
      mockLPData.lpPosition!.interestAccrued,
      mockPool.reserveTokenDecimals
    );
    expect(screen.getByText(/Healthy/i)).toBeInTheDocument();
  });

  it("renders Warning status when liquidityHealth is 2", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{
          ...mockLPData,
          lpPosition: { ...mockLPData.lpPosition!, liquidityHealth: 2 },
        }}
      />
    );
    expect(screen.getByText(/Warning/i)).toBeInTheDocument();
  });

  it("renders Liquidatable status when liquidityHealth is 1", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{
          ...mockLPData,
          lpPosition: { ...mockLPData.lpPosition!, liquidityHealth: 1 },
        }}
      />
    );
    expect(screen.getByText(/Liquidatable/i)).toBeInTheDocument();
  });

  it("renders Unknown status when liquidityHealth is undefined", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{
          ...mockLPData,
          lpPosition: { ...mockLPData.lpPosition!, liquidityHealth: 0 },
        }}
      />
    );
    expect(screen.getByText(/Unknown/i)).toBeInTheDocument();
  });

  it("handles missing assetShare gracefully", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{
          ...mockLPData,
          lpPosition: { ...mockLPData.lpPosition!, assetShare: BigInt(0) },
        }}
      />
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("handles missing lastRebalanceCycle gracefully", () => {
    render(
      <LPPositionsCard
        pool={mockPool}
        lpData={{
          ...mockLPData,
          lpPosition: { ...mockLPData.lpPosition!, lastRebalanceCycle: BigInt(0) },
        }}
      />
    );
   expect(screen.getByText(/Cycle #0/)).toBeInTheDocument();
  });
});
