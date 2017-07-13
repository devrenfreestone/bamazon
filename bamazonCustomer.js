var mysql = require("mysql");
var inquirer = require("inquirer");
var Table = require('cli-table');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "admin",
    database: "bamazon"
});

connection.connect(function(err) {
    if (err) throw err;
    displayStore();
});


// instantiate cli-tble to pull from mysql
// var table = new Table({
//     head: ['Item Id', 'Product Name', 'Department Name', 'Price', 'Stock Quantity'],
//     colWidths: [10, 30, 18, 10, 18]
// });

// table is an Array, so you can `push`, `unshift`, `splice` and friends 
// console.log(table.toString());

//this is to show the table with the current products, stock qty's, etc.
function displayStore() {
    let query = "SELECT * FROM products";
    connection.query(query, function(err, res) {
        var table = new Table({
            head: ['Item Id', 'Product Name', 'Department Name', 'Price', 'Stock Quantity'],
            colWidths: [10, 30, 18, 10, 18]
        });

        for (let i = 0; i < res.length; i++) {

            table.push(
                [res[i].Item_id, res[i].product_name, res[i].department_name, res[i].price, res[i].stock_quantity]
            );
        }
        console.log(table.toString());
        // console.log("The query worked");

        id();
    });
}

//these are to hold the values needed to adjust the qty's of the database
var purchaseId = [];
var quantityToBuy = 0;

//this asks for the id # of the product to be purchased - triggered by displayStore()
var id = () => {
    inquirer
        .prompt({
            name: "action",
            type: "input",
            message: "What is the id of the product you would like to buy?",

        })
        .then(function(answer) {
            purchaseId.pop();
            purchaseId.push(answer.action);
            let query = "SELECT * FROM products WHERE item_Id = ?";
            connection.query(query, purchaseId, function(err, results) {
                inquirer
                    .prompt({
                        name: "action",
                        type: "confirm",
                        message: "Okay, that's " + results[0].product_name + ", right?",

                    })
                    .then(function(answer) {
                        if (answer.action) {
                            qty();
                        } else id();
                    })
            });
        });
}

//this asks for the qty to be purchased - triggered by id()
function qty() {
    inquirer
        .prompt({
            name: "action",
            type: "input",
            message: "How many would you like?",

        })
        .then(function(answer) {
            quantityToBuy = answer.action;
            checkqty();
        })
}

//this checks the qty requested against the available qty
var price = 0;
var itemPrice = 0;
var stock_quantity = 0;
var update = [];

function checkqty() {
    let query = "SELECT * FROM products WHERE Item_id = ?";
    connection.query(query, purchaseId, function(err, results) {
        if (quantityToBuy <= results[0].stock_quantity) {
            stock_quantity = results[0].stock_quantity;
            var newQuantity = stock_quantity - quantityToBuy;
            itemPrice = results[0].price;
            price = itemPrice * quantityToBuy;
            purchase(newQuantity, purchaseId[0]);
        } else {
            inquirer
                .prompt({
                    name: "action",
                    type: "input",
                    message: "Look, that'd be great, but I don't have that many. How many would you like? (Pick a number less than or equal to " + results[0].stock_quantity + ")",

                })
            qty();
        }
    });
}


//this calculates the price and changes the qty of the product in the database.
function purchase(stock, item) {
    console.log("Okay, let's get your order ready. That'll be $" + price + ". Hope you've got cash...Processing your order now.");
    let query = "UPDATE products SET stock_quantity = ? WHERE Item_id = ?";
    connection.query(query, [stock, item], function(err, results) {
        displayStore();
    });

}
