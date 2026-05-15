export const SELECT_ALL_VALUE = '__all__'
export const SELECT_NONE_VALUE = '__none__'

export function toSelectValue(value: string | null | undefined, emptyValue = SELECT_NONE_VALUE) {
  return value && value.length > 0 ? value : emptyValue
}

export function fromOptionalSelectValue(value: string, emptyValue = SELECT_NONE_VALUE) {
  return value === emptyValue ? '' : value
}
