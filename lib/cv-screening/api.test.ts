import { describe, expect, it } from "vitest";

import { buildCvScreeningFormData } from "./api";

describe("buildCvScreeningFormData", () => {
  it("builds multipart payload with the expected fields", async () => {
    const formData = buildCvScreeningFormData({
      file: new File(["resume"], "candidate.pdf", {
        type: "application/pdf",
      }),
      jobDescription: "Senior Backend Engineer",
      connectionId: "conn-123",
    });

    expect(formData.get("job_description")).toBe("Senior Backend Engineer");
    expect(formData.get("connection_id")).toBe("conn-123");

    const file = formData.get("file");
    expect(file).toBeInstanceOf(File);
    expect((file as File).name).toBe("candidate.pdf");
    expect(await (file as File).text()).toBe("resume");
  });
});
