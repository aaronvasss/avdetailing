import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { HeroSection } from "@/components/home/HeroSection";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("homepage hero actions", () => {
  it("Book Your Detail navigates to the existing booking entry", () => {
    render(<MemoryRouter><Routes>
      <Route path="/" element={<HeroSection />} />
      <Route path="/book" element={<div data-testid="booking-entry" />} />
    </Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("link", { name: "Book Your Detail" }));
    expect(screen.getByTestId("booking-entry")).toBeInTheDocument();
  });

  it("Our Services scrolls to the existing services section", () => {
    const scrollIntoView = vi.fn();
    render(<MemoryRouter><HeroSection /><section id="services" /></MemoryRouter>);
    const services = document.getElementById("services");
    if (!services) throw new Error("Missing services fixture");
    services.scrollIntoView = scrollIntoView;
    fireEvent.click(screen.getByRole("button", { name: "Our Services" }));
    expect(scrollIntoView).toHaveBeenCalledExactlyOnceWith({ behavior: "smooth" });
  });
});