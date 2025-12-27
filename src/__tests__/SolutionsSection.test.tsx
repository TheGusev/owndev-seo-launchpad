/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import SolutionsSection from "@/components/Solutions/SolutionsSection";

describe("SolutionsSection", () => {
  it("renders at least 3 solution cards", () => {
    render(<SolutionsSection />);
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
