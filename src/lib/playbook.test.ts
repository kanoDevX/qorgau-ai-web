import { describe, expect, it } from "vitest";
import { playbookFor } from "./playbook";

describe("verdict playbook", () => {
  it("safe bands always get the calm playbook", () => {
    expect(playbookFor("Minimal", "BankImpersonationCall")).toBe("safe");
    expect(playbookFor("Low", "PhishingLink")).toBe("safe");
  });
  it("risky bands follow the scheme", () => {
    expect(playbookFor("Critical", "BankImpersonationCall")).toBe("call");
    expect(playbookFor("High", "PhishingLink")).toBe("link");
    expect(playbookFor("Elevated", "MessengerAccountTakeover")).toBe("relative");
    expect(playbookFor("High", "InvestmentScam")).toBe("money");
    expect(playbookFor("High", "Unknown")).toBe("generic");
  });
});
