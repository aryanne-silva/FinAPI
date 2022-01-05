function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.params

  const hasCustomer = customers.find((customer) => customer.cpf === cpf)

  if (!hasCustomer)
    return response.status(400).json({ error: 'customer not found' })

  request.customer = hasCustomer

  return next()
}

module.exports = verifyIfExistsAccountCPF
