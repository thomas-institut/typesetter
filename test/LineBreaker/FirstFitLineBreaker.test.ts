import {describe, expect, it, vi} from "vitest";
import {FirstFitLineBreaker} from "@/LineBreaker/FirstFitLineBreaker";
import {TextBoxFactory} from "@/TextBoxFactory";
import {Penalty} from "@/Penalty";
import {Glue} from "@/Glue";
import {TextBoxMeasurer} from "@/TextBoxMeasurer/TextBoxMeasurer";
import {getFakeBidiOrder} from "../FakeStringTextDirection";

const InfiniteBadness = 100000000;

function createMeasuredTextBox(text: string, width: number) {
  return TextBoxFactory.simpleText(text).setWidth(width).setHeight(1);
}

describe("FirstFitLineBreaker", () => {
  it("should return an empty array when item and bidi info arrays have different lengths", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {
      // silence expected test output
    });

    const lines = await FirstFitLineBreaker.breakIntoLines(
      [TextBoxFactory.simpleText("hello")],
      200,
      new TextBoxMeasurer(),
      []
    );

    expect(lines).toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();

    errorSpy.mockRestore();
  });

  it("should append the last index to break points when it is not returned by getBreakPoints", async () => {
    const itemArray = [createMeasuredTextBox("left", 4), createMeasuredTextBox("right", 5)];
    const bidiOrderInfoArray = getFakeBidiOrder(itemArray, "ltr");

    const getBreakPointsSpy = vi.spyOn(FirstFitLineBreaker, "getBreakPoints").mockResolvedValue([0]);
    let seenBreakpoints: number[] = [];
    const getLinesFromBreakpointsSpy = vi.spyOn(FirstFitLineBreaker, "getLinesFromBreakpoints")
      .mockImplementation((_items, breakpoints) => {
        seenBreakpoints = breakpoints;
        return [];
      });

    await FirstFitLineBreaker.breakIntoLines(itemArray, 200, new TextBoxMeasurer(), bidiOrderInfoArray);

    expect(getBreakPointsSpy).toHaveBeenCalledOnce();
    expect(getLinesFromBreakpointsSpy).toHaveBeenCalledOnce();
    expect(seenBreakpoints).toEqual([0, itemArray.length - 1]);

    getBreakPointsSpy.mockRestore();
    getLinesFromBreakpointsSpy.mockRestore();
  });

  it("should include forced break penalties in break points", async () => {
    const itemArray = [
      TextBoxFactory.simpleText("one"),
      Penalty.createForcedBreakPenalty(),
      TextBoxFactory.simpleText("two"),
      new Glue(1).setStretch(1).setShrink(1),
      TextBoxFactory.simpleText("three")
    ];

    const breakPoints = await FirstFitLineBreaker.getBreakPoints(
      itemArray,
      40,
      new TextBoxMeasurer(),
      []
    );

    expect(breakPoints).toContain(1);
  });

  it("should include penalty insertions and remove penalties in produced lines", () => {
    const hyphen = createMeasuredTextBox("-", 1);
    const hyphenPenalty = new Penalty().setPenalty(-50).setItemToInsert(hyphen);

    const itemArray = [
      createMeasuredTextBox("hel", 3),
      hyphenPenalty,
      createMeasuredTextBox("lo", 2),
      Penalty.createForcedBreakPenalty()
    ];

    const lines = FirstFitLineBreaker.getLinesFromBreakpoints(itemArray, [1, 3]);

    expect(lines.map(line => line.getText())).toEqual(["hel-", "lo"]);
    lines.forEach(line => {
      expect(line.getList().every(item => !(item instanceof Penalty))).toBe(true);
    });
  });

  it("should skip leading non-box items when initializing a new line", () => {
    const itemArray = [
      new Glue(1),
      new Penalty(),
      createMeasuredTextBox("word", 4),
      new Glue(1)
    ];

    const initialized = FirstFitLineBreaker.initializeLine(0, 3, itemArray);

    expect(initialized.length).toBe(2);
    expect(initialized[0].getWidth()).toBe(4);
    expect(initialized[1]).toBeInstanceOf(Glue);
  });

  it("should update flagged penalties count and reset it for non-penalty breaks", () => {
    const flaggedPenalty = new Penalty().setFlag(true);

    expect(FirstFitLineBreaker.getUpdatedFlagsInARow(flaggedPenalty, 1)).toBe(2);
    expect(FirstFitLineBreaker.getUpdatedFlagsInARow(createMeasuredTextBox("box", 3), 2)).toBe(0);
  });

  it("should return infinite badness when adjustment ratio cannot be calculated", async () => {
    const badness = await FirstFitLineBreaker.calculateHorizontalBadness(
      [createMeasuredTextBox("word", 4)],
      10,
      new TextBoxMeasurer()
    );

    expect(badness).toBe(InfiniteBadness);
  });

  it("should add penalty and flagged-penalty increments to horizontal badness", async () => {
    const itemArray = [
      createMeasuredTextBox("word", 5),
      new Glue().setWidth(3).setStretch(2).setShrink(2)
    ];
    const flaggedPenalty = new Penalty().setPenalty(20).setFlag(true);

    const badness = await FirstFitLineBreaker.calculateHorizontalBadness(
      itemArray,
      10,
      new TextBoxMeasurer(),
      flaggedPenalty,
      1
    );

    expect(badness).toBe(1120);
  });
});
