import { dom } from "./dom-setup";
import test from "node:test";
import assert from "node:assert/strict";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { PathnameContext } from "next/dist/shared/lib/hooks-client-context.shared-runtime.js";
import { DealerTable } from "../src/components/DealerTable";
import { RevealCard } from "../src/components/RevealCard";
import { TarotExperience } from "../src/components/TarotExperience";
import { CardLibrary } from "../src/components/CardLibrary";
import { LanguageProvider } from "../src/components/Language";
import { emptyReading, readingReducer, shuffleDeck } from "../src/lib/reading";
import { adjacentCard } from "../src/lib/dealer";

const container = document.getElementById("root")!;
const tick = () => new Promise((resolve) => setTimeout(resolve, 10));
async function click(button: Element | null) {
  assert.ok(button, "expected an interactive element");
  await act(async () => {
    (button as HTMLElement).click();
    await tick();
  });
}
const button = (text: string) =>
  [...document.querySelectorAll("button")].find(
    (b) => b.textContent?.trim() === text,
  ) ?? null;
async function mount(page: "reading" | "library" = "reading") {
  container.replaceChildren();
  const root = createRoot(container);
  await act(async () => {
    root.render(
      <PathnameContext.Provider value={page === "reading" ? "/" : "/cards/"}>
        <LanguageProvider>
          {page === "reading" ? <TarotExperience /> : <CardLibrary />}
        </LanguageProvider>
      </PathnameContext.Provider>,
    );
    await tick();
  });
  return () => act(() => root.unmount());
}

test("the entire five-card ritual works without WebGL and reset keeps its confirmation boundary", async () => {
  localStorage.clear();
  history.replaceState(null, "", "/");
  const unmount = await mount();
  try {
    assert.match(document.querySelector("h1")!.textContent!, /your attention/);
    assert.equal(document.querySelectorAll("canvas").length, 0);
    await click(button("Let the cards speak"));
    assert.equal(document.querySelectorAll("[data-card-index]").length, 78);
    const first = document.querySelector<HTMLButtonElement>(
      '[data-card-index="0"]',
    )!;
    first.focus();
    await act(async () => {
      first.dispatchEvent(
        new dom.window.KeyboardEvent("keydown", {
          key: "ArrowRight",
          bubbles: true,
        }),
      );
    });
    assert.equal(
      (document.activeElement as HTMLElement).dataset.cardIndex,
      "1",
    );
    for (const index of [1, 5, 12, 25, 77])
      await click(document.querySelector(`[data-card-index="${index}"]`));
    await act(async () => {
      await tick();
    });
    for (let index = 0; index < 5; index++) {
      await click(button("Reveal this card"));
      await act(async () => {
        await tick();
      });
      await click(
        button(
          index === 4
            ? "Bring the story together"
            : "Continue to the next card",
        ),
      );
    }
    assert.match(document.querySelector("h1")!.textContent!, /Five stories/);
    const saved = JSON.parse(
      localStorage.getItem("midnight-arcana.reading.v1")!,
    );
    assert.equal(saved.selected.length, 5);
    assert.equal(saved.revealed.length, 5);
    await click(button("Understand your reading"));
    assert.match(document.querySelector("h1")!.textContent!, /threads/);
    assert.equal(document.querySelectorAll("article").length >= 5, true);
    await click(button("Begin another reading"));
    assert.equal(
      document.querySelector<HTMLDialogElement>("dialog")?.open,
      true,
    );
    await click(button("Keep this reading"));
    assert.equal(
      JSON.parse(localStorage.getItem("midnight-arcana.reading.v1")!).revealed
        .length,
      5,
    );
    await click(button("Begin another reading"));
    await click(button("Begin again"));
    assert.match(document.querySelector("h1")!.textContent!, /your attention/);
    assert.deepEqual(
      JSON.parse(localStorage.getItem("midnight-arcana.reading.v1")!).selected,
      [],
    );
  } finally {
    await unmount();
  }
});

test("restoring a partial reading and switching language preserves choices and question", async () => {
  localStorage.clear();
  history.replaceState(null, "", "/");
  let saved = { ...emptyReading, question: "What should I make room for?" };
  saved = readingReducer(saved, { type: "start", deck: shuffleDeck(true) });
  for (const index of [3, 8])
    saved = readingReducer(saved, { type: "select", index });
  localStorage.setItem("midnight-arcana.reading.v1", JSON.stringify(saved));
  const unmount = await mount();
  try {
    assert.match(document.body.textContent!, /2 of 5 chosen/);
    const select = document.querySelector("select")!;
    await act(async () => {
      select.value = "zh-CN";
      select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await tick();
    });
    assert.equal(document.documentElement.lang, "zh-CN");
    assert.match(document.body.textContent!, /已选择 2/);
    const restored = JSON.parse(
      localStorage.getItem("midnight-arcana.reading.v1")!,
    );
    assert.deepEqual(restored.selected, saved.selected);
    assert.deepEqual(restored.deck, saved.deck);
    assert.equal(restored.question, saved.question);
  } finally {
    await unmount();
  }
});

test("library filtering, empty search, and upright/reversed details remain available", async () => {
  localStorage.clear();
  history.replaceState(null, "", "/cards/");
  const unmount = await mount("library");
  try {
    assert.equal(document.querySelectorAll("button img").length, 78);
    await click(button("Major Arcana"));
    assert.equal(document.querySelectorAll("button img").length, 22);
    await click(document.querySelector("button img")!.closest("button"));
    assert.equal(
      document.querySelector<HTMLDialogElement>("dialog")!.open,
      true,
    );
    await click(button("↧ Reversed"));
    assert.equal(button("↧ Reversed")!.getAttribute("aria-pressed"), "true");
    assert.ok(document.querySelector("dialog img.rotate-180"));
    await click(document.querySelector('[aria-label="Close card details"]'));
    // Native input setter is required to model React's change tracking in a DOM test.
    const input = document.querySelector<HTMLInputElement>(
      'input[type="search"]',
    )!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        dom.window.HTMLInputElement.prototype,
        "value",
      )!.set!.call(input, "no-such-card-xyz");
      input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
      input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
      await tick();
    });
    assert.equal(document.querySelectorAll("button img").length, 0);
    await click(button("Show all cards"));
    assert.equal(document.querySelectorAll("button img").length, 78);
  } finally {
    await unmount();
  }
});

test("keyboard deck traversal skips chosen cards and respects the deck boundaries", () => {
  assert.equal(adjacentCard(0, "ArrowLeft", 6, []), 0);
  assert.equal(adjacentCard(0, "ArrowRight", 6, [1, 2]), 3);
  assert.equal(adjacentCard(0, "ArrowDown", 6, [6]), 12);
  assert.equal(adjacentCard(77, "ArrowRight", 6, []), 77);
  assert.equal(adjacentCard(40, "Home", 6, [0, 1]), 2);
  assert.equal(adjacentCard(40, "End", 6, [77]), 76);
});

test("HTML deck arrival finishes and reducing motion snaps a card reveal to its final face", async () => {
  container.replaceChildren();
  const root = createRoot(container);
  let finished = 0;
  const deck = shuffleDeck(false);
  try {
    await act(async () => {
      root.render(
        <DealerTable
          deck={deck}
          selected={[]}
          active={false}
          reduced={false}
          onDealComplete={() => finished++}
          onPick={() => {}}
        />,
      );
      await tick();
    });
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1900));
    });
    assert.ok(
      finished >= 1,
      "the animation must complete without a WebGL callback",
    );
    assert.equal(document.querySelectorAll("[data-deck-art]").length, 78);
    assert.equal(document.querySelectorAll("canvas").length, 0);
    await act(async () => {
      root.render(
        <RevealCard
          image="/cards/major-00.webp"
          reversed={false}
          revealed={false}
          reduced={false}
          skipVersion={0}
        />,
      );
    });
    await act(async () => {
      root.render(
        <RevealCard
          image="/cards/major-00.webp"
          reversed={false}
          revealed={true}
          reduced={false}
          skipVersion={0}
        />,
      );
    });
    await act(async () => {
      root.render(
        <RevealCard
          image="/cards/major-00.webp"
          reversed={false}
          revealed={true}
          reduced={true}
          skipVersion={1}
        />,
      );
    });
    assert.ok(
      [...container.querySelectorAll("span")].some(
        (span) => span.style.transform === "rotateY(180deg)",
      ),
    );
  } finally {
    await act(() => root.unmount());
  }
});
