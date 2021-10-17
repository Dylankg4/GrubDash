const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function dishExists(req,res,next) {
  const dishId = req.params.dishId
  res.locals.dishId = dishId;
  const dishFind = dishes.find(dish=> dish.id === dishId);
  if(!dishFind){
    return next({
      status:404,
      message: `Dish not found`
    })
  }
    res.locals.dish = dishFind;
}

const validName = (req,res,next)=>{
  const {data=null} = req.body;
  res.locals.newDD = data;
  const dishName = data.name;
  if(!dishName || dishName.length ===0){
    return next({
      status: 400,
      message: "Dish must include a name"
    })
  }
}

const validDescription = (req,res,next)=>{
  const {data=null} = req.body;
  res.locals.newDD = data;
  const dishDescript = data.description;
  if(!dishDescript || dishDescript.length === 0){
    return next({
      status: 400,
      message: "Dish must include a description"
    })
  }
}

const validPrice = (req,res,next) => {
  const dishPrice = res.locals.newDD.price;
  if(!dishPrice || dishPrice <= 0 || typeof dishPrice != "number"){
    return next({
      status: 400,
      message: "Dish must have a price that is an integer greater than 0"
    })
  }
}

const validImage = (req,res,next) =>{
  const dishImage = res.locals.newDD.image_url;
  if(!dishImage || dishImage.length ===0){
    return next({
      status:400,
      message: "Dish must include a image_url"
    })
  }
}

const validId = (req,res,next) => {
  const dishId = res.locals.dishId;
  const {id=null} = res.locals.newDD;
  if(dishId != id && id){
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    })
  }
  
}


const readValid = (req, res, next) => {
   dishExists(req, res, next);
   next();
};

const createValid = (req,res,next)=>{
  validName(req,res,next);
  validDescription(req,res,next);
  validPrice(req,res,next);
  validImage(req,res,next);
  next();
}

const updateValid = (req,res,next) =>{
  dishExists(req,res,next)
  validName(req,res,next);
  validDescription(req,res,next);
  validPrice(req,res,next);
  validImage(req,res,next);
  validId(req,res,next);
  next();
}

function list(req,res){
  res.status(200).json({data: dishes})
}

function create(req, res, next){
  const newDishData = res.locals.newDD;
  newDishData.id = nextId();
  dishes.push(newDishData);
  res.status(201).json({
    data: newDishData
  })
}

function read(req, res) {
   res.status(200).json({ data: res.locals.dish });
}

function update(req,res,next){
  const newData = res.locals.newDD;
  const oldData = res.locals.dish;
  const index = dishes.indexOf(oldData);
  for(const key in newData){
    dishes[index][key] = newData[key];
  }
  res.status(200).json({ data: dishes[index]})
}

module.exports = {
  list,
  create: [createValid, create],
  read: [readValid, read],
  update: [updateValid, update],
}