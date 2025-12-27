/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import Hero from "@/components/Hero/Hero";

describe("Hero", () => {
  it("renders H1 with correct text", () => {
    render(<Hero />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent(
      "OWNDEV — платформа, которая выводит продукт за пределы орбиты"
    );
  });

  it('renders CTA button "Запросить демо"', () => {
    render(<Hero />);
    const button = screen.getByRole("button", { name: /запросить демо/i });
    expect(button).toBeInTheDocument();
  });
});
