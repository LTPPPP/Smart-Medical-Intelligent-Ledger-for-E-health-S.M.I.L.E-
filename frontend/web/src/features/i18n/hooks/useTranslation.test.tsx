import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { useTranslation } from "./useTranslation";
import { LocaleProvider } from "../provider/LocaleProvider";

function TranslationProbe() {
	const { t } = useTranslation();
	return <span>{t("common.retry", "Retry")}</span>;
}

describe("useTranslation", () => {
	afterEach(() => cleanup());

	it("renders the default locale deterministically on the first render", () => {
		render(
			<LocaleProvider>
				<TranslationProbe />
			</LocaleProvider>,
		);

		expect(screen.getByText("Thử lại")).toBeInTheDocument();
	});
});
