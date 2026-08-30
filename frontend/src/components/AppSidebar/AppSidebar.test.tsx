import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { store } from "../../store/store";
import { AppSidebar } from "./AppSidebar";

const user = {
  userId: "user_1",
  displayName: "Test User",
  email: "test@example.com",
  avatarUrl: null,
  provider: "dev",
} as const;

describe("AppSidebar", () => {
  it("provides every directly navigable application destination", () => {
    const html = renderToStaticMarkup(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/records"]}>
          <AppSidebar currentUser={user} />
        </MemoryRouter>
      </Provider>,
    );

    expect(html).toContain('href="/dashboard"');
    expect(html).toContain('href="/capture"');
    expect(html).toContain('href="/records"');
    expect(html).toContain('href="/compare"');
    expect(html).not.toContain('href="/records/:recordId"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain("Test User");
  });
});
