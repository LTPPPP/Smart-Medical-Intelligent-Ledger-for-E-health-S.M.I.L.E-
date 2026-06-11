const FRONT_IMAGE_MESSAGE =
  "We couldn't read the front of your citizen ID. Upload a clearer image with all four corners visible.";
const BACK_IMAGE_MESSAGE =
  "We couldn't read the back of your citizen ID. Upload a clearer image with all four corners visible.";
const ID_NUMBER_MESSAGE =
  'Enter the 12-digit number printed on your citizen ID.';

const collectMessages = (error: unknown): string[] => {
  if (!error || typeof error !== 'object') return [];
  const response = (
    error as { response?: { data?: { message?: unknown; error?: unknown } } }
  ).response;
  const values = [
    response?.data?.message,
    response?.data?.error,
    (error as { message?: unknown }).message,
  ];
  return values.flatMap((value) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : typeof value === 'string'
        ? [value]
        : [],
  );
};

export const getKycErrorMessage = (error: unknown): string => {
  const message = collectMessages(error).join(' ').toLowerCase();
  if (message.includes('front')) return FRONT_IMAGE_MESSAGE;
  if (message.includes('back')) return BACK_IMAGE_MESSAGE;
  if (message.includes('12-digit') || message.includes('id number')) {
    return ID_NUMBER_MESSAGE;
  }
  if (message.includes('already pending')) {
    return 'Your current submission is still being reviewed.';
  }
  if (message.includes('consent')) {
    return 'Please accept the identity verification terms before submitting.';
  }
  return "We couldn't submit your documents. Check both images and try again.";
};

export const KYC_MESSAGES = {
  frontImage: FRONT_IMAGE_MESSAGE,
  backImage: BACK_IMAGE_MESSAGE,
  idNumber: ID_NUMBER_MESSAGE,
  processing: 'We are reading your citizen ID. This usually takes a short moment.',
} as const;
