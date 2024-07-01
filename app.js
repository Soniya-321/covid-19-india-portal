const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const toDate = require('date-fns/toDate')

const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

const checkRequestsQueries = async (request, response, next) => {
  const {status, priority, search_q, category, date} = request.query
  const {todoId} = request.params

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray == true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'LOW', 'MEDIUM']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (date !== undefined) {
    try {
      const myDate = new Date(date)
      const formatedDate = format(new Date(date), 'yyyy-MM-dd')
      const result = toDate(
        new Date(
          `${myDate.getFullYear()}-${
            myDate.getMonth() + 1
          }-${myDate.getDate()}`,
        ),
      )
      const isValidDate = await isValid(result)
      if (isValidDate === true) {
        request.date = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todoId = todoId
  request.search_q = search_q

  next()
}

const checkRequestBody = async (request, response, next) => {
  const {id, todo, category, priority, status, dueDate} = request.body
  const {todoId} = request.params

  if (status !== undefined) {
    const statusArray = ['TO DO', 'IN PROGRESS', 'DONE']
    const statusIsInArray = statusArray.includes(status)
    if (statusIsInArray == true) {
      request.status = status
    } else {
      response.status(400)
      response.send('Invalid Todo Status')
      return
    }
  }

  if (priority !== undefined) {
    const priorityArray = ['HIGH', 'LOW', 'MEDIUM']
    const priorityIsInArray = priorityArray.includes(priority)
    if (priorityIsInArray === true) {
      request.priority = priority
    } else {
      response.status(400)
      response.send('Invalid Todo Priority')
      return
    }
  }

  if (category !== undefined) {
    const categoryArray = ['WORK', 'HOME', 'LEARNING']
    const categoryIsInArray = categoryArray.includes(category)
    if (categoryIsInArray === true) {
      request.category = category
    } else {
      response.status(400)
      response.send('Invalid Todo Category')
      return
    }
  }

  if (dueDate !== undefined) {
    try {
      const myDate = new Date(dueDate)
      const formatedDate = format(new Date(dueDate), 'yyyy-MM-dd')
      console.log(formatedDate)
      const result = toDate(new Date(formatedDate))
      const isValidDate = isValid(result)
      if (isValidDate === true) {
        request.dueDate = formatedDate
      } else {
        response.status(400)
        response.send('Invalid Due Date')
        return
      }
    } catch (e) {
      response.status(400)
      response.send('Invalid Due Date')
      return
    }
  }

  request.todo = todo
  request.id = id

  request.todoId = todoId

  next()
}

//API 1
app.get('/todos/', checkRequestsQueries, async (request, response) => {
  const {
    status = '',
    priority = '',
    category = '',
    search_q = '',
    date = '',
  } = request.query
  const selectQuery = `
    SELECT id, todo, priority, status, category, due_date as dueDate 
    FROM todo 
    WHERE 
    status like '%${status}%' AND priority like '%${priority}%'
    AND category like '%${category}%' AND todo like '%${search_q}%' ;
    
  `
  const dbUser = await db.all(selectQuery)
  response.send(dbUser)
})

//API 2
app.get('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request.params
  const selectQuery = `
    SELECT 
    id, todo, priority, status, category, due_date as dueDate
    FROM todo 
    WHERE id = ${todoId};
  `
  const todoArray = await db.get(selectQuery)
  response.send(todoArray)
})

//API 3
app.get('/agenda/', checkRequestsQueries, async (request, response) => {
  const {date} = request
  const selectDueDateQuery = `
    SELECT id, todo, priority, status, category, due_date as dueDate
    FROM todo 
    WHERE due_date = '${date}';
  `
  const todoArray = await db.all(selectDueDateQuery)
  if (todoArray === undefined) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    response.send(todoArray)
  }
})

//API 4
app.post('/todos/', checkRequestBody, async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request
  const addQuery = `
    INSERT INTO todo 
    (id, todo, priority, status, category, due_date)
    VALUES 
    ( 
      ${id},
      '${todo}',
      '${priority}',
      '${status}',
      '${category}',
      '${dueDate}'
    );
  `
  const addTodo = await db.run(addQuery)
  response.send('Todo Successfully Added')
})

//API 5
app.put('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {status, priority, category, todo, dueDate} = request
  const {todoId} = request
  let updateQuery

  switch (true) {
    case status !== undefined:
      updateQuery = `
       UPDATE todo
       SET  status = '${status}'
        WHERE id = ${todoId};
      `
      await db.run(updateQuery)
      response.send('Status Updated')
      break
    case priority !== undefined:
      updateQuery = `
        UPDATE todo 
        SET priority = '${priority}'
        WHERE id = ${todoId};
      `
      await db.run(updateQuery)
      response.send('Priority Updated')
      break
    case category !== undefined:
      updateQuery = `
        UPDATE todo 
        SET category = '${category}'
        WHERE id = ${todoId};
      `
      await db.run(updateQuery)
      response.send('Category Updated')
      break
    case todo !== undefined:
      updateQuery = `
        UPDATE todo 
        SET todo = '${todo}'
        WHERE id = ${todoId};
      `
      await db.run(updateQuery)
      response.send('Todo Updated')
      break
    case dueDate !== undefined:
      updateQuery = `
        UPDATE todo 
        SET due_date = '${dueDate}'
        WHERE id = ${todoId};
      `
      await db.run(updateQuery)
      response.send('Due Date Updated')
      break
  }
})

//API 6
app.delete('/todos/:todoId/', checkRequestBody, async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
    DELETE FROM todo 
    WHERE id = ${todoId};
  `
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
