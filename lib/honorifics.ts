/**
 * Islamic Honorific Data
 * Contains all 21 Arabic honorifics with their metadata
 */

export const HONORIFICS = {
  // Allah (5)
  awj: { arabic: 'عز وجل', category: 'allah', label: 'Azza wa Jall' },
  swt: { arabic: 'سبحانه وتعالى', category: 'allah', label: 'Subhanahu wa Ta\'ala' },
  twt: { arabic: 'تبارك وتعالى', category: 'allah', label: 'Tabaraka wa Ta\'ala' },
  jal: { arabic: 'جل جلاله', category: 'allah', label: 'Jalla Jalaluhu' },
  jwa: { arabic: 'جل وعلا', category: 'allah', label: 'Jalla wa \'Ala' },

  // Prophet ﷺ (2)
  sas: { arabic: 'صلى الله عليه وسلم', category: 'prophet', label: 'Sallallahu Alayhi wa Sallam' },
  asws: { arabic: 'عليه الصلاة والسلام', category: 'prophet', label: 'Alayhi As-Salatu wa As-Salam' },

  // Prophets (4)
  as: { arabic: 'عليه السلام', category: 'prophets', label: 'Alayhi As-Salam (m)' },
  ahas: { arabic: 'عليها السلام', category: 'prophets', label: 'Alayha As-Salam (f)' },
  amas: { arabic: 'عليهما السلام', category: 'prophets', label: 'Alayhima As-Salam (dual)' },
  amus: { arabic: 'عليهم السلام', category: 'prophets', label: 'Alayhim As-Salam (pl)' },

  // Companions (5)
  radu: { arabic: 'رضي الله عنه', category: 'companions', label: 'Radiyallahu Anhu (m)' },
  rada: { arabic: 'رضي الله عنها', category: 'companions', label: 'Radiyallahu Anha (f)' },
  radum: { arabic: 'رضي الله عنهم', category: 'companions', label: 'Radiyallahu Anhum (pl)' },
  raduma: { arabic: 'رضي الله عنهما', category: 'companions', label: 'Radiyallahu Anhuma (dual)' },
  radunna: { arabic: 'رضي الله عنهن', category: 'companions', label: 'Radiyallahu Anhunna (f-pl)' },

  // Scholars (5)
  rahimahu: { arabic: 'رحمه الله', category: 'scholars', label: 'Rahimahullah (m)' },
  rahimaha: { arabic: 'رحمها الله', category: 'scholars', label: 'Rahimahallah (f)' },
  rahimahum: { arabic: 'رحمهم الله', category: 'scholars', label: 'Rahimahumullah (pl)' },
  rahimahuma: { arabic: 'رحمهما الله', category: 'scholars', label: 'Rahimahumallah (dual)' },
  rahimahunna: { arabic: 'رحمهن الله', category: 'scholars', label: 'Rahimahunnallah (f-pl)' },
} as const;

export type HonorificType = keyof typeof HONORIFICS;
export type HonorificCategory = 'allah' | 'prophet' | 'prophets' | 'companions' | 'scholars';

export const HONORIFIC_CATEGORIES: Record<HonorificCategory, { label: string; labelFr: string }> = {
  allah: { label: 'Allah', labelFr: 'Allah' },
  prophet: { label: 'Prophet ﷺ', labelFr: 'Prophète ﷺ' },
  prophets: { label: 'Prophets', labelFr: 'Prophètes' },
  companions: { label: 'Companions', labelFr: 'Compagnons' },
  scholars: { label: 'Scholars', labelFr: 'Savants' },
};

export function getHonorificsByCategory(category: HonorificCategory): Array<{ type: HonorificType; data: typeof HONORIFICS[HonorificType] }> {
  return (Object.entries(HONORIFICS) as Array<[HonorificType, typeof HONORIFICS[HonorificType]]>)
    .filter(([, data]) => data.category === category)
    .map(([type, data]) => ({ type, data }));
}

export function isValidHonorific(type: string): type is HonorificType {
  return type in HONORIFICS;
}
