/*
 *  Created a Table with name todo in the todoApplication.db file using the CLI.
 */

const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const { parse } = require("date-fns");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const oonvertToDbResponseObject = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = ``;
  const { search_q = "", priority, status, category, dueDate } = request.query;

  switch (true) {
    case request.query.status !== undefined:
      getTodosQuery = `Select * from todo where todo like '%${search_q}%' and status='${status}';`;

      break;
    case request.query.priority !== undefined:
      getTodosQuery = `Select * from todo where todo like '%${search_q}%' and priority='${priority}';`;
      break;
    case request.query.priority !== undefined &&
      request.query.status !== undefined:
      getTodosQuery = `select * from todo where todo like '%${search_q}%' and status='${status}' and priority='${priority}';`;
      break;
    case request.query.search_q !== "":
      getTodosQuery = `select * from todo where todo like'%${search_q}%';`;
      break;
    case request.query.category !== undefined &&
      request.query.status !== undefined:
      getTodosQuery = `select * from todo where todo like '%${search_q}%' and category ='${category}' and status ='${status}';`;
      break;

    case hasCategoryProperty(request.query):
      getTodosQuery = `select * from todo where todo like '%${search_q}%' and category ='${category}';`;
      break;

    case request.query.priority !== undefined &&
      request.query.category !== undefined:
      getTodosQuery = `select * from todo where todo like '%${search_q}' and priority ='${priority}' and category ='${category}';`;
      break;
  }
  data = await database.all(getTodosQuery);
  response.send(data.map((each) => oonvertToDbResponseObject(each)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `select * from todo where id=${todoId};`;
  const data = await database.get(getTodoQuery);
  response.send(oonvertToDbResponseObject(data));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const parsedDate = parse(date);
  const day = parsedDate.getDate();
  const month = parsedDate.getMonth();
  const year = parsedDate.getFullYear();

  const fdate = format(new Date(year, month, day), "yyyy-MM-dd");
  if (isValid(parsedDate)) {
    const getTodosQuery = `SELECT * FROM todo WHERE due_date = '${fdate}';`;
    const data = await database.all(getTodosQuery);
    response.send(data.map((each) => oonvertToDbResponseObject(each)));
  }
});
