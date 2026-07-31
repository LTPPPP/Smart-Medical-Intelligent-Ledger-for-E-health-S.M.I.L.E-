import admin from "./admin.json";
import appointments from "./appointments.json";
import auth from "./auth.json";
import booking from "./booking.json";
import chat from "./chat.json";
import clinic from "./clinic.json";
import common from "./common.json";
import dashboard from "./dashboard.json";
import examination from "./examination.json";
import header from "./header.json";
import landing from "./landing.json";
import nav from "./nav.json";
import patients from "./patients.json";
import payments from "./payments.json";
import profile from "./profile.json";
import schedule from "./schedule.json";
import sidebar from "./sidebar.json";
import test from "./test.json";

const dict = {
	common,
	auth,
	nav,
	header,
	sidebar,
	dashboard,
	patients,
	appointments,
	booking,
	payments,
	profile,
	test,
	clinic,
	schedule,
	admin,
	examination,
	chat,
	landing,
} as const;

export default dict;
export type Dictionary = typeof dict;
