const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

function orderExists(req,res,next){
  const orderId = req.params.orderId
  res.locals.orderId = orderId
  const orderFind = orders.find(order=> order.id === orderId);
  if(!orderFind){
    return next({
      status:404,
      message: `order not found ${orderId}`
    })
  }
  res.locals.order = orderFind
}

function deliverToValid(req,res,next){
  const {data=null} = req.body
  res.locals.newOr = data
  if(!data.deliverTo || data.deliverTo.length === 0){
    next({
      status: 400,
      message: "Order must include a deliverTo"
    })
  }
}

function mobileValid(req,res,next){
  const orderNumber = res.locals.newOr.mobileNumber;
  if(!orderNumber || orderNumber.length === 0){
     next({
       status: 400,
       message: "Order must include a mobileNumber"
     })
  }
}

function dishValid(req,res,next){
  const dishes = res.locals.newOr.dishes
  if(!dishes || dishes.length === 0 || !Array.isArray(dishes)){
   return next({
      status: 400,
      message: "Order must include at least one dish"
    })
  }
  res.locals.dishes = dishes
}

function dishQuantityValid(req,res,next){
  const dishes = res.locals.dishes
  dishes.forEach(dish=>{
    const quant = dish.quantity
    if(!quant || quant <= 0 || !Number.isInteger(quant)){
      next({
        status: 400,
        message: `Dish ${dishes.indexOf(dish)} must have a quantity that is an integer greater than 0`
      })
    }
  })
}

function validOrderId(req,res,next){
  const ordersId = res.locals.orderId;
  const {id=null} = res.locals.newOr;
  if(!id || id === null){
    res.locals.newOr.id = res.locals.orderId
  } else if(ordersId != id){
    next({
      status:400,
      message: `Order id does not match route id. Order: ${id}, Route: ${ordersId}.`,
    })
  }
}

function validStatus(req,res,next){
  const {status=null} = res.locals.newOr;
  if(!status || status.length === 0 || status === "invalid"){
    next({
      status: 400,
      message: "Order must have a status of pending, preparing, out-for-delivery, delivered"
    })
  }
}

function isStatusPending(req,res,next){
  const {status=null} = res.locals.order;
  if(status !== "pending"){
    return next({
      status: 400,
      message: "An order cannot be deleted unless it is pending",
    })
  }
}

const validDelivery = (req, res, next) => {
   const { status = null } = res.locals.order;
   if (status === "delivered") {
      return next({
         status: 400,
         message: "A delivered order cannot be changed",
      });
   }
};


const createValid=(req,res,next)=>{
  deliverToValid(req,res,next);
  mobileValid(req,res,next);
  dishValid(req,res,next);
  dishQuantityValid(req,res,next);
  next();
}

const readValid=(req,res,next)=>{
  orderExists(req,res,next);
  next();
}

const updateValid=(req,res,next)=>{
  orderExists(req,res,next);
  deliverToValid(req,res,next);
  mobileValid(req,res,next);
  dishValid(req,res,next);
  dishQuantityValid(req,res,next);
  validOrderId(req,res,next);
  validStatus(req,res,next);
  validDelivery(req,res,next);
  next();
}

const validDestroy= (req,res,next)=>{
  orderExists(req,res,next);
  isStatusPending(req,res,next);
  next();
}

function list(req,res,next){
  res.json({data: orders})
}

function create(req,res,next){
  const newOrder = res.locals.newOr
  newOrder.id = nextId()
  orders.push(newOrder)
  res.status(201).json({ data: newOrder})
  next()
}

function read(req, res){
  res.json({data: res.locals.order})
}

function update(req, res) {
   const newData = res.locals.newOr;
   const oldData = res.locals.order;
   const index = orders.indexOf(oldData);
   for (const key in newData) {
      orders[index][key] = newData[key];
   }
   res.status(200).json({ data: orders[index] });
}

function destroy(req,res,next){
  const index = orders.indexOf(res.locals.order);
  orders.splice(index, 1);
  res.sendStatus(204);
}

module.exports = {
  list,
  create:[createValid, create],
  read: [readValid, read],
  update: [updateValid, update],
  destroy: [validDestroy, destroy],
}
