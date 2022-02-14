import { Template } from "src";
import { Constants } from "src/Constants";

describe("link", () => {
	test("Should resolve", () => {
		expect(Template).toEqual(expect.anything());
	});

	test("Is Proxy", () => {
		expect((Template as any)[Constants.IsProxy]).toEqual(true);
	});
});
