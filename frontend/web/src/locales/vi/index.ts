import common from "./common.json";
import auth from "./auth.json";
import nav from "./nav.json";
import header from "./header.json";
import sidebar from "./sidebar.json";
import dashboard from "./dashboard.json";
import patients from "./patients.json";
import appointments from "./appointments.json";
import booking from "./booking.json";
import payments from "./payments.json";
import profile from "./profile.json";
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
} as const;

export default dict;
