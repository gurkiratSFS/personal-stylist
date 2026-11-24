import { createBrowserClient } from "@supabase/ssr";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

jest.mock("@supabase/ssr", () => ({
  createBrowserClient: jest.fn(() => ({ mocked: true })),
}));

const createBrowserClientMock = createBrowserClient as jest.MockedFunction<
  typeof createBrowserClient
>;

describe("createBrowserSupabaseClient", () => {
  beforeEach(() => {
    createBrowserClientMock.mockClear();
  });

  it("passes only the URL and publishable key to createBrowserClient", () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    };

    createBrowserSupabaseClient(env);

    expect(createBrowserClientMock).toHaveBeenCalledTimes(1);
    expect(createBrowserClientMock).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "publishable-key",
    );
    expect(createBrowserClientMock.mock.calls[0]).toHaveLength(2);
  });
});
