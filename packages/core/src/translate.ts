export type PluralText = {
  readonly one: string
  readonly other: string
  readonly zero?: string
}

export type TextValue = string | PluralText

export type Texts = { readonly [key: string]: TextValue }

export type TextKey<T extends Texts> = keyof T & string

type Placeholders<S extends string> = S extends `${string}{${infer Name}}${infer Rest}`
  ? Name | Placeholders<Rest>
  : never

type PluralPlaceholders<V extends PluralText> =
  | 'count'
  | Placeholders<V['one']>
  | Placeholders<V['other']>
  | (V['zero'] extends string ? Placeholders<V['zero']> : never)

type ParamNames<V extends TextValue> = V extends string
  ? Placeholders<V>
  : V extends PluralText
    ? PluralPlaceholders<V>
    : never

export type TextParams<V extends TextValue> = [ParamNames<V>] extends [never]
  ? never
  : { readonly [N in ParamNames<V>]: string | number }

type TextArgs<V extends TextValue> = [ParamNames<V>] extends [never] ? [] : [params: TextParams<V>]

export type TranslateFn<T extends Texts> = <K extends TextKey<T>>(
  key: K,
  ...args: TextArgs<T[K]>
) => string

function fill(template: string, params: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name]
    return value === undefined ? match : String(value)
  })
}

export function createT<const T extends Texts>(texts: T, locale = 'en'): TranslateFn<T> {
  const rules = new Intl.PluralRules(locale)
  return (key, ...args) => {
    const value: TextValue | undefined = texts[key]
    if (value === undefined) return key
    const params = (args[0] ?? {}) as Readonly<Record<string, string | number>>
    if (typeof value === 'string') return fill(value, params)
    const count = Number(params['count'])
    const template =
      count === 0 && value.zero !== undefined
        ? value.zero
        : rules.select(count) === 'one'
          ? value.one
          : value.other
    return fill(template, params)
  }
}
