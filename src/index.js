const express = require("express");
const { v4: uuid_v4 } = require("uuid")

const app = express();

app.use(express.json());

const customers = [];

function verifyIfCustomerExist(request, response, next) {
    const {cpf} = request.headers;
    const customer = customers.find(customer => customer.cpf === cpf);

    if(!customer){
        return response.status(400).json({error: "Customer not found"})
    }

    request.customer = customer;
    
    return next();
}

function getBalance(statement){
    const balance = statement.reduce((acc, operation)=>{
        if(operation.type === 'credit')
            return acc + operation.amount;
        return acc - operation.amount;
    }, 0)
    return balance;
}

app.post("/account", (request, response)=>{
    const {cpf, name} = request.body;
    
    const customerAlreadyExists = customers.some((customer) => customer.cpf === cpf)
    
    if(customerAlreadyExists){
        return response.status(400).json({error: "Customer already exists!"})
    }

    const customer = {
        cpf,
        name,
        uuid: uuid_v4(),
        statement: []
    }
    customers.push(customer);
    console.log(customers);
    return response.status(201).send(customers);
});

app.use(verifyIfCustomerExist)

app.put("/account", (request, response)=>{
    const {name} = request.body;
    const {customer} = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", (request, response)=>{
    const {customer} = request;

    return response.status(200).json(customer);
});

app.delete("/account", (request, response)=>{
    const {customer} = request;
    
    customers.splice(customer, 1);
    
    return response.status(200).json(customers);
});

app.get("/statement", (request, response)=>{
    const { customer } = request;
    return response.status(200).json(customer.statement);
});

app.get("/statement/date", (request, response)=>{
    const {date} = request.query;
    const { customer } = request;

    const dateFormat = new Date(date + " 00:00");

    const statement = customer.statement.filter((statement) => statement.createdAt.toDateString() === new Date(dateFormat).toDateString())

    return response.status(200).json(statement);
});

app.post("/deposit", (request, response)=>{
    const {description, amount} = request.body;
    const {customer} = request;

    const statementOperation = {
        description,
        amount,
        createdAt: new Date(),
        type: "credit"
    };

    customer.statement.push(statementOperation);
    return response.status(201).send();
});

app.post("/withdraw", (request, response)=>{
    const {amount} = request.body;
    const {customer} = request;
    const balance = getBalance(customer.statement);
    
    if(balance < amount)
        return response.status(400).json({error: "Insufficient funds"})
    
    const statementOperation = {
        amount,
        createdAt: new Date(),
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});

app.get("/balance", (request, response)=>{
    const {customer} = request;
    const balance = getBalance(customer.statement);

    console.log(customer.statement);

    return response.status(200).json(balance);
});

app.listen("3333");