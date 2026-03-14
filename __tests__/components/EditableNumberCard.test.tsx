import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditableNumberCard from "@/components/EditableNumberCard";

describe("EditableNumberCard", () => {
  const defaultProps = {
    title: "Current Weight",
    ariaLabel: "Edit weight",
    value: null,
    unit: "kg",
    statusText: "",
    isEditing: false,
    isPending: false,
    editValue: "",
    onStartEditing: vi.fn(),
    onCancel: vi.fn(),
    onSave: vi.fn(),
    onChange: vi.fn(),
    onKeyDown: vi.fn(),
    inputRef: { current: null },
    noValueMessage: "No value set",
    noValueSubMessage: "Click to set",
    dataTestId: "test-value-display",
  };

  const renderComponent = (props = {}) =>
    render(<EditableNumberCard {...defaultProps} {...props} />);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders title and pencil icon when not editing", () => {
    renderComponent();

    expect(screen.getByText("Current Weight")).toBeInTheDocument();
    expect(
      screen.getByRole("button").querySelector("svg.lucide-pencil"),
    ).toBeInTheDocument();
  });

  it("shows no-value message when value is null and not editing", () => {
    renderComponent();

    expect(screen.getByText("No value set")).toBeInTheDocument();
    expect(screen.getByText("Click to set")).toBeInTheDocument();
    expect(screen.queryByTestId("test-value-display")).not.toBeInTheDocument();
  });

  it("shows value and unit when value exists and not editing", () => {
    renderComponent({ value: 75.5 });

    expect(screen.getByTestId("test-value-display")).toHaveTextContent("75.5");
    expect(screen.getByText("kg")).toBeInTheDocument();
    expect(screen.queryByText("No value set")).not.toBeInTheDocument();
  });

  it("shows status text when provided", () => {
    renderComponent({ value: 68, statusText: "Last updated: today" });

    expect(screen.getByText("Last updated: today")).toBeInTheDocument();
  });

  it("calls onStartEditing on card click when not editing", async () => {
    const user = userEvent.setup();
    renderComponent({ value: 82 });

    await user.click(screen.getByRole("button"));

    expect(defaultProps.onStartEditing).toHaveBeenCalledTimes(1);
  });

  it("calls onStartEditing on Enter/Space key when not editing", async () => {
    const user = userEvent.setup();
    renderComponent();

    const card = screen.getByRole("button");
    await user.tab(); // ensure focus is possible
    card.focus();

    await user.keyboard("{Enter}");
    expect(defaultProps.onStartEditing).toHaveBeenCalledTimes(1);

    defaultProps.onStartEditing.mockClear();

    card.focus();
    await user.keyboard(" ");
    expect(defaultProps.onStartEditing).toHaveBeenCalledTimes(1);
  });

  it("renders input, save/cancel buttons and unit when editing", () => {
    renderComponent({
      isEditing: true,
      editValue: "92.4",
      inputRef: { current: document.createElement("input") },
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveValue(92.4);
    expect(input).toHaveAttribute("step", "0.1");
    expect(input).toHaveAttribute("min", "0");

    expect(screen.getByText("kg")).toBeInTheDocument();

    const actionButtons = screen.getAllByRole("button").filter(
      (b) => b !== screen.getByRole("button", { name: "Edit weight" }),
    );

    expect(actionButtons).toHaveLength(2);

    expect(actionButtons[0].querySelector("svg.lucide-check")).toBeInTheDocument();
    expect(actionButtons[1].querySelector("svg.lucide-x")).toBeInTheDocument();
  });

  it("calls onChange when typing in input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderComponent({
      isEditing: true,
      editValue: "70",
      onChange,
    });

    const input = screen.getByRole("spinbutton");
    await user.type(input, ".5");

    expect(onChange).toHaveBeenCalledWith("70.5");
  });

  it("calls onSave when clicking check button", async () => {
    const user = userEvent.setup();
    renderComponent({ isEditing: true });

    const actionButtons = screen.getAllByRole("button").filter(
      (b) => b !== screen.getByRole("button", { name: "Edit weight" }),
    );
    const checkButton = actionButtons.find((b) =>
      b.querySelector("svg.lucide-check"),
    );

    await user.click(checkButton!);

    expect(defaultProps.onSave).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when clicking X button", async () => {
    const user = userEvent.setup();
    renderComponent({ isEditing: true });

    const actionButtons = screen.getAllByRole("button").filter(
      (b) => b !== screen.getByRole("button", { name: "Edit weight" }),
    );
    const cancelButton = actionButtons.find((b) =>
      b.querySelector("svg.lucide-x"),
    );

    await user.click(cancelButton!);

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("applies pending styles when isPending is true during edit", () => {
    renderComponent({
      isEditing: true,
      isPending: true,
      editValue: "88",
    });

    const input = screen.getByRole("spinbutton");
    expect(input).toHaveClass("opacity-70");
    expect(input).toHaveClass("animate-pulse");
    expect(input).toBeDisabled();
  });

  it("shows input even when starting edit from null value", () => {
    renderComponent({
      isEditing: true,
      value: null,
      editValue: "",
    });

    expect(screen.getByRole("spinbutton")).toBeInTheDocument();
    expect(screen.queryByText("No value set")).not.toBeInTheDocument();
  });

  it("focus management is passed via inputRef (smoke test)", () => {
    const inputRef = { current: null };
    renderComponent({
      isEditing: true,
      inputRef,
    });

    expect(inputRef.current).not.toBeNull();
  });
});