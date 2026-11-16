/** Cyrillic + Latin street-type tokens for Nominatim query normalisation. */
export const NOMINATIM_STREET_PREFIX =
  /^(ул|улица|бул|булевард|пл|площад|ul|ulitsa|bul|blvd|pl|street|str|via|piazza|platz|út|ut)\.?$/iu;