export const getSmsUnitCount = (characterCount) => {
  if (characterCount <= 0) return 0;
  if (characterCount <= 160) return 1;
  if (characterCount <= 320) return 2;
  return 3;
};
