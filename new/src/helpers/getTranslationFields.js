export default function getTranslationFields(
  languages,
  values,
  field = 'title',
  replaceEmpty = true,
) {
  const nonEmptyValue = languages?.reduce((result, language) => {
    const currentValue = values?.[`${field}[${language?.locale}]`];
    if (currentValue && !result) {
      result = currentValue;
    }
    return result;
  }, undefined);

  const list = languages?.map((item) => ({
    [item?.locale]: !values[`${field}[${item?.locale}]`]
      ? replaceEmpty
        ? nonEmptyValue
        : undefined
      : values[`${field}[${item?.locale}]`],
  }));

  return Object.assign({}, ...list);
}
