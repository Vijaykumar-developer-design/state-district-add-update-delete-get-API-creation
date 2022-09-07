const express = require("express");
const path = require("path");
const { open } = require("sqlite"); //link to database
const sqlite3 = require("sqlite3"); //allows us to communicate with database
const app = express(); // calling express framework and storing it into app for API creation
app.use(express.json()); //it accepts input in the form of object from url
const dbPath = path.join(__dirname, "covid19India.db"); //database path

let db = null; //data storing to db so first we are giving null and we are sending request through it to database

//Syntax for getting data from database
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`); // logging to console error message
    process.exit(1); // if error raised stop executing and exit
  }
};

initializeDBAndServer();

//API 1
const convertToObject = (array) => {
  return {
    stateId: array.state_id,
    stateName: array.state_name,
    population: array.population,
  };
};

app.get("/states/", async (request, response) => {
  const statesQuery = `
    SELECT * FROM state;`;
  const statesArray = await db.all(statesQuery);
  const stateDetailsObj = statesArray.map((eachState) =>
    convertToObject(eachState)
  );
  response.send(stateDetailsObj);
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params; //getting value from url ex:stateId http://localhost:3000/states/10/ here 10 is stateId
  const stateByIdQuery = `
    SELECT * FROM state WHERE state_id = ${stateId};`;
  const stateArray = await db.get(stateByIdQuery); //sending request
  response.send(convertToObject(stateArray));
});

//API 3
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body; //objects in database table ex: column names
  const addDistrictQuery = `
    INSERT INTO
     district (district_name,state_id,cases,cured,active,deaths)
    VALUES( 
    "${districtName}",
    "${stateId}",
    "${cases}",
    "${cured}",
    "${active}",
    "${deaths}");`;
  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
const getEachDistrictObj = (district) => {
  return {
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtsQuery = `
    SELECT * FROM district WHERE district_id = ${districtId};`;
  const districtArray = await db.get(districtsQuery);
  //   response.send(districtArray);
  response.send(getEachDistrictObj(districtArray));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDeleteQuery = `
    DELETE FROM district WHERE district_id = ${districtId};`;
  await db.run(districtDeleteQuery);
  response.send("District Removed"); //sending response to the user
});

//API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateQuery = `
    UPDATE district
    SET
    district_name = '${districtName}',
    state_id = '${stateId}',
    cases = '${cases}',
    cured = '${cured}',
    active = '${active}',
    deaths = '${deaths}';`;
  await db.run(updateQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
SELECT
SUM(cases),
SUM(cured),
SUM(active),
SUM(deaths)
FROM
district
WHERE
state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getBYiDQuery = `
    SELECT state_name as stateName FROM state
    join district on district.state_id = state.state_id 
    WHERE district.district_id = '${districtId}';`;
  const stateNameArray = await db.get(getBYiDQuery);
  response.send(stateNameArray);
});
module.exports = app; // by this export we can use these APIS in any module by just importing
