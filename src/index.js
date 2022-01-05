const { response, request } = require('express')
const express = require('express')
const { v4: uuidv4 } = require('uuid')
const verifyIfExistsAccountCPF = require('./middleware/verifyIfExistsAccountCPF')

const app = express()
app.use(express.json())
app.listen(3333) //=== localhost:3333

const customers = []

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    } else {
      return (acc = operation.amount)
    }
  }, 0)

  return balance
}

app.post('/account', (request, response) => {
  const { cpf, name } = request.body

  const customerAlreadyExists = customers.some(
    (customer) => customer.cpf === cpf
  )

  if (customerAlreadyExists)
    return response.status(400).json({ error: 'customer already exists' })

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  })

  return response.status(201).send()
})

app.put('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { name } = request.body

  customer.name = name

  return response.status(201).send()
})

app.get('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.json(customer)
})

app.delete('/account', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  customers.splice(customer, 1)

  return response.status(200).json(customers)
})

app.get('/statement/:cpf', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  return response.json(customer.statement)
})

app.get('/statement/date', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { date } = request.query

  const dateFormatted = new Date(date + ' 00:00').toDateString

  const statement = customer.statement.filter(
    (statement) => statement.createAt.toDateString() === dateFormatted
  )

  if (statement) return statement

  return response.json(customer.statement)
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body

  const { customer } = request

  const statementOperation = {
    description,
    amount,
    createAt: new Date(),
    type: 'credit',
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request
  const { amount } = request.body

  const currentBalance = getBalance(customer.statement)

  if (currentBalance < amount)
    return response.status(400).json({ error: 'insufficient funds :(' })

  const statementOperation = {
    amount,
    createAt: new Date(),
    type: 'debit',
  }

  customer.statement.push(statementOperation)

  return response.status(201).send()
})

app.get('/balance', verifyIfExistsAccountCPF, (request, response) => {
  const { customer } = request

  const balance = getBalance(customer.statement)

  return response.json(balance)
})
