export type NamesMap = Record<string, { firstName: string; lastName: string; maybe?: boolean }>;

export function loadNames(orgId: string): NamesMap {
  try {
    return JSON.parse(localStorage.getItem(`contact-names-${orgId}`) ?? "{}");
  } catch {
    return {};
  }
}

export function persistNames(orgId: string, names: NamesMap) {
  localStorage.setItem(`contact-names-${orgId}`, JSON.stringify(names));
}
