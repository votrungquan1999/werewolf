/**
 * Matches a sentence whose player name is rendered as its own element.
 *
 * Copy like "Pass the phone to Mai" is split so the name can be coloured, and
 * Testing Library's default text matcher only ever sees an element's *direct* text
 * children — so the whole sentence never matches. This compares `textContent` and
 * then keeps only the innermost element, so the assertion cannot match an ancestor
 * as well and trip the multiple-elements error.
 * @param sentence - The finished line, name included.
 * @returns A matcher for `getByText` and friends.
 */
export function namedLine(
  sentence: string,
): (content: string, element: Element | null) => boolean {
  return (_content, element) =>
    element?.textContent === sentence &&
    Array.from(element.children).every(
      (child) => child.textContent !== sentence,
    );
}
