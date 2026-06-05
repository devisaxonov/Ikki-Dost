const somFormatter = new Intl.NumberFormat('uz-UZ', {
  maximumFractionDigits: 2,
})

export const formatSom = (value) => {
  const amount = Number(value)

  return `${somFormatter.format(Number.isFinite(amount) ? amount : 0)} so'm`
}
