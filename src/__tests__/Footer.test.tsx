/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Footer from "@/components/Footer/Footer";

describe("Footer", () => {
  it('renders "Follow us" text', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    expect(screen.getByText("Follow us")).toBeInTheDocument();
  });

  it("renders at least 2 social links", () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);
  });
});
