import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DeliveryScheduleBoundary } from "@/components/dashboard/DeliverySchedulePanel";

describe("delivery module recovery", () => {
  it("keeps the dashboard mounted when the delivery module fails", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const BrokenModule = (): JSX.Element => {
      throw new Error("Failed to fetch dynamically imported module: DeliverySchedule");
    };
    try {
      render(
        <main>
          <div data-testid="dashboard" />
          <DeliveryScheduleBoundary><BrokenModule /></DeliveryScheduleBoundary>
        </main>
      );
      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });
});