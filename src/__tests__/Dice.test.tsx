import React from "react";
import { render, screen } from "@testing-library/react";
import { Dice, SingleDie, DiceResult } from "@/components/Dice";

describe("SingleDie", () => {
  it("should render a die with correct aria label", () => {
    render(<SingleDie value={5} />);
    const die = screen.getByRole("img", { name: /die showing 5/i });
    expect(die).toBeInTheDocument();
  });

  it("should clamp values below 1 to 1", () => {
    render(<SingleDie value={0} />);
    const die = screen.getByRole("img", { name: /die showing 1/i });
    expect(die).toBeInTheDocument();
  });

  it("should clamp values above 6 to 6", () => {
    render(<SingleDie value={10} />);
    const die = screen.getByRole("img", { name: /die showing 6/i });
    expect(die).toBeInTheDocument();
  });

  it("should round non-integer values", () => {
    render(<SingleDie value={3.7} />);
    const die = screen.getByRole("img", { name: /die showing 4/i });
    expect(die).toBeInTheDocument();
  });

  it("should apply rolling class when rolling", () => {
    const { container } = render(<SingleDie value={3} rolling={true} />);
    const die = container.querySelector(".animate-dice-roll");
    expect(die).toBeInTheDocument();
  });

  it("should not apply rolling class when not rolling", () => {
    const { container } = render(<SingleDie value={3} rolling={false} />);
    const die = container.querySelector(".animate-dice-roll");
    expect(die).not.toBeInTheDocument();
  });

  it("should apply custom size", () => {
    const { container } = render(<SingleDie value={3} size={100} />);
    const die = container.firstChild as HTMLElement;
    expect(die.style.width).toBe("100px");
    expect(die.style.height).toBe("100px");
  });

  it("should render correct number of pips for each value", () => {
    // Value 1 should have 1 pip
    const { container: c1 } = render(<SingleDie value={1} />);
    expect(c1.querySelectorAll(".rounded-full.bg-gray-800")).toHaveLength(1);

    // Value 6 should have 6 pips
    const { container: c6 } = render(<SingleDie value={6} />);
    expect(c6.querySelectorAll(".rounded-full.bg-gray-800")).toHaveLength(6);
  });
});

describe("Dice", () => {
  it("should render multiple dice", () => {
    render(<Dice values={[3, 4]} />);
    expect(screen.getByRole("img", { name: /die showing 3/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /die showing 4/i })).toBeInTheDocument();
  });

  it("should render nothing for empty values", () => {
    const { container } = render(<Dice values={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("should have correct group aria label", () => {
    render(<Dice values={[1, 6]} />);
    const group = screen.getByRole("group", { name: /dice showing 1, 6/i });
    expect(group).toBeInTheDocument();
  });

  it("should pass rolling prop to all dice", () => {
    const { container } = render(<Dice values={[1, 2, 3]} rolling={true} />);
    const rollingDice = container.querySelectorAll(".animate-dice-roll");
    expect(rollingDice).toHaveLength(3);
  });

  it("should apply custom className", () => {
    const { container } = render(<Dice values={[1, 2]} className="custom-class" />);
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("should apply custom size to all dice", () => {
    const { container } = render(<Dice values={[1, 2]} size={80} />);
    const dice = container.querySelectorAll('[role="img"]');
    dice.forEach((die) => {
      expect((die as HTMLElement).style.width).toBe("80px");
    });
  });
});

describe("DiceResult", () => {
  it("should render dice and sum by default", () => {
    render(<DiceResult values={[3, 4]} />);
    expect(screen.getByText("Sum: 7")).toBeInTheDocument();
  });

  it("should hide sum when showSum is false", () => {
    render(<DiceResult values={[3, 4]} showSum={false} />);
    expect(screen.queryByText(/sum:/i)).not.toBeInTheDocument();
  });

  it("should calculate sum correctly", () => {
    render(<DiceResult values={[6, 6]} />);
    expect(screen.getByText("Sum: 12")).toBeInTheDocument();
  });

  it("should not show sum for empty values", () => {
    const { container } = render(<DiceResult values={[]} />);
    expect(screen.queryByText(/sum:/i)).not.toBeInTheDocument();
    // The Dice component returns null for empty values
    expect(container.querySelector('[role="group"]')).not.toBeInTheDocument();
  });

  it("should apply custom className", () => {
    const { container } = render(
      <DiceResult values={[1, 2]} className="result-class" />
    );
    expect(container.querySelector(".result-class")).toBeInTheDocument();
  });
});
