import { afterEach, describe, expect, it, vi } from "vitest";

const originalChatApiUrl = process.env.NEXT_PUBLIC_CHAT_API_URL;
const originalIngestApiUrl = process.env.NEXT_PUBLIC_INGEST_API_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_CHAT_API_URL = originalChatApiUrl;
  process.env.NEXT_PUBLIC_INGEST_API_URL = originalIngestApiUrl;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("uploadDocument", () => {
  it("uses the multipart ingest flow for rag uploads", async () => {
    process.env.NEXT_PUBLIC_CHAT_API_URL = "https://chat.example.com";
    process.env.NEXT_PUBLIC_INGEST_API_URL = "https://ingest.example.com";

    const calls: Array<{
      input: string;
      init?: RequestInit;
    }> = [];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      calls.push({ input: url, init });

      if (url === "https://ingest.example.com/ingest/uploads/initiate") {
        return Response.json({
          uploadId: "upload-1",
          documentId: "doc-1",
          s3Key: "documents/doc-1",
          contentType: "application/pdf",
          partSizeBytes: 4,
          partCount: 3,
          expiresInSeconds: 900,
          parts: [
            { partNumber: 2, url: "https://upload.example.com/part-2" },
            { partNumber: 1, url: "https://upload.example.com/part-1" },
            { partNumber: 3, url: "https://upload.example.com/part-3" },
          ],
        });
      }

      if (url.startsWith("https://upload.example.com/")) {
        return new Response(null, { status: 200 });
      }

      if (url === "https://ingest.example.com/ingest/uploads/complete") {
        return Response.json({
          documentId: "doc-1",
          status: "queued",
        });
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { uploadDocument } = await import("./api");
    const response = await uploadDocument(new File(["abcdefghij"], "report.pdf"));

    expect(response).toEqual({
      documentId: "doc-1",
      status: "queued",
    });

    const initiateCall = calls[0];
    expect(initiateCall?.input).toBe(
      "https://ingest.example.com/ingest/uploads/initiate",
    );
    expect(initiateCall?.init?.method).toBe("POST");
    expect(JSON.parse(String(initiateCall?.init?.body))).toEqual({
      documentName: "report.pdf",
      sizeBytes: 10,
      contentType: "application/pdf",
      source: "webhook",
    });

    const uploadCalls = calls.filter((call) =>
      call.input.startsWith("https://upload.example.com/"),
    );
    expect(uploadCalls.map((call) => call.input)).toEqual([
      "https://upload.example.com/part-1",
      "https://upload.example.com/part-2",
      "https://upload.example.com/part-3",
    ]);
    expect(await (uploadCalls[0]?.init?.body as Blob).text()).toBe("abcd");
    expect(await (uploadCalls[1]?.init?.body as Blob).text()).toBe("efgh");
    expect(await (uploadCalls[2]?.init?.body as Blob).text()).toBe("ij");

    const completeCall = calls[calls.length - 1];
    expect(completeCall?.input).toBe(
      "https://ingest.example.com/ingest/uploads/complete",
    );
    expect(JSON.parse(String(completeCall?.init?.body))).toEqual({
      uploadId: "upload-1",
    });
  });

  it("stops before complete when a part upload fails", async () => {
    process.env.NEXT_PUBLIC_CHAT_API_URL = "https://chat.example.com";
    process.env.NEXT_PUBLIC_INGEST_API_URL = "https://ingest.example.com";

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === "https://ingest.example.com/ingest/uploads/initiate") {
        return Response.json({
          uploadId: "upload-1",
          documentId: "doc-1",
          s3Key: "documents/doc-1",
          contentType: "application/pdf",
          partSizeBytes: 5,
          partCount: 1,
          expiresInSeconds: 900,
          parts: [{ partNumber: 1, url: "https://upload.example.com/part-1" }],
        });
      }

      if (url === "https://upload.example.com/part-1") {
        expect(init?.method).toBe("PUT");
        return new Response(null, { status: 500 });
      }

      if (url === "https://ingest.example.com/ingest/uploads/complete") {
        throw new Error("Complete should not be called when upload fails");
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const { uploadDocument } = await import("./api");

    await expect(
      uploadDocument(new File(["abcde"], "report.pdf", { type: "application/pdf" })),
    ).rejects.toThrow("Failed to upload document part 1");
  });
});
